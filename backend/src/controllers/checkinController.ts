import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { DailyCheckinRequest, DailyCheckinResponse, N8nWebhookPayload } from '../types';
import axios from 'axios';

const QUIZ_THRESHOLD = 7;
const FOCUS_THRESHOLD = 1;  // Changed from 60 to 1 for TESTING ONLY! Change back to 60 for production!

export const dailyCheckin = async (req: Request, res: Response) => {
  try {
    const { student_id, quiz_score, focus_minutes, tab_switches, cheating_detected, mentor_email }: DailyCheckinRequest & { mentor_email?: string } = req.body;

    // Validation
    if (!student_id || quiz_score === undefined || focus_minutes === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: student_id, quiz_score, focus_minutes' 
      });
    }

    if (quiz_score < 0 || quiz_score > 10) {
      return res.status(400).json({ error: 'quiz_score must be between 0 and 10' });
    }

    if (focus_minutes < 0) {
      return res.status(400).json({ error: 'focus_minutes must be >= 0' });
    }

    // Fetch student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // THE LOGIC GATE: Determine success or failure
    const isSuccess = quiz_score > QUIZ_THRESHOLD && focus_minutes > FOCUS_THRESHOLD && !cheating_detected;
    const logStatus = isSuccess ? 'success' : 'failed';
    
    // DEBUG LOGGING
    console.log('🎯 LOGIC GATE CHECK:');
    console.log('  quiz_score:', quiz_score, '> THRESHOLD:', QUIZ_THRESHOLD, '=', quiz_score > QUIZ_THRESHOLD);
    console.log('  focus_minutes:', focus_minutes, '> THRESHOLD:', FOCUS_THRESHOLD, '=', focus_minutes > FOCUS_THRESHOLD);
    console.log('  cheating_detected:', cheating_detected, '!cheating =', !cheating_detected);
    console.log('  RESULT:', isSuccess ? '✅ SUCCESS' : '❌ FAIL');

    // Insert daily log
    const { data: dailyLog, error: logError } = await supabaseAdmin
      .from('daily_logs')
      .insert({
        student_id,
        quiz_score,
        focus_minutes,
        status: logStatus,
        tab_switches: tab_switches || 0,
        cheating_detected: cheating_detected || false,
        notes: cheating_detected ? 'Tab switching detected during focus session' : null
      })
      .select()
      .single();

    if (logError || !dailyLog) {
      console.error('Error inserting daily log:', logError);
      return res.status(500).json({ error: 'Failed to log daily check-in' });
    }

    // SUCCESS PATH
    if (isSuccess) {
      // Update student status to on_track if they were in intervention
      if (student.status !== 'on_track') {
        await supabaseAdmin
          .from('students')
          .update({ status: 'on_track' })
          .eq('id', student_id);
      }

      const response: DailyCheckinResponse = {
        status: 'On Track',
        message: 'Great job! You are on track.',
        student_status: 'on_track'
      };

      return res.status(200).json(response);
    }

    // FAILURE PATH: THE LOCK
    // Update student status to needs_intervention
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ status: 'needs_intervention' })
      .eq('id', student_id);

    if (updateError) {
      console.error('Error updating student status:', updateError);
    }

    // Create intervention record
    const { data: intervention, error: interventionError } = await supabaseAdmin
      .from('interventions')
      .insert({
        student_id,
        daily_log_id: dailyLog.id,
        status: 'pending'
      })
      .select()
      .single();

    if (interventionError || !intervention) {
      console.error('Error creating intervention:', interventionError);
      return res.status(500).json({ error: 'Failed to create intervention' });
    }

    // Trigger n8n webhook (Mentor Dispatcher)
    if (process.env.N8N_WEBHOOK_URL) {
      const webhookPayload: N8nWebhookPayload & { mentor_email?: string } = {
        student_id: student.id,
        student_name: student.name,
        student_email: student.email,
        quiz_score,
        focus_minutes,
        daily_log_id: dailyLog.id,
        intervention_id: intervention.id,
        tab_switches: tab_switches || 0,
        cheating_detected: cheating_detected || false,
        mentor_email: mentor_email || 'mentor@alcovia.com'  // For recruiter testing
      };

      try {
        await axios.post(process.env.N8N_WEBHOOK_URL, webhookPayload);
        console.log('✅ n8n webhook triggered successfully');
      } catch (webhookError) {
        console.error('❌ Error triggering n8n webhook:', webhookError);
        // Don't fail the request if webhook fails
      }
    } else {
      console.warn('⚠️  N8N_WEBHOOK_URL not configured');
    }

    const response: DailyCheckinResponse = {
      status: 'Pending Mentor Review',
      message: 'Your performance needs attention. A mentor will review your progress.',
      student_status: 'needs_intervention',
      intervention_id: intervention.id
    };

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${student_id}`).emit('status_update', {
        status: 'needs_intervention',
        message: response.message
      });
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in dailyCheckin:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

