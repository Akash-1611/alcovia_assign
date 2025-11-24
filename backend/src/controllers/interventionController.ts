import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AssignInterventionRequest } from '../types';

// Endpoint called by n8n after mentor approves remedial task
export const assignIntervention = async (req: Request, res: Response) => {
  try {
    const { student_id, intervention_id, remedial_task }: AssignInterventionRequest = req.body;

    // Validation
    if (!student_id || !intervention_id || !remedial_task) {
      return res.status(400).json({ 
        error: 'Missing required fields: student_id, intervention_id, remedial_task' 
      });
    }

    // Update intervention record
    const { data: intervention, error: interventionError } = await supabaseAdmin
      .from('interventions')
      .update({
        status: 'assigned',
        remedial_task,
        mentor_responded_at: new Date().toISOString()
      })
      .eq('id', intervention_id)
      .eq('student_id', student_id)
      .select()
      .single();

    if (interventionError || !intervention) {
      console.error('Error updating intervention:', interventionError);
      return res.status(404).json({ error: 'Intervention not found' });
    }

    // THE UNLOCK: Update student status to remedial_assigned
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ status: 'remedial_assigned' })
      .eq('id', student_id);

    if (updateError) {
      console.error('Error updating student status:', updateError);
      return res.status(500).json({ error: 'Failed to update student status' });
    }

    // Emit WebSocket event for real-time unlock (Bonus #2)
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${student_id}`).emit('intervention_assigned', {
        status: 'remedial_assigned',
        remedial_task,
        intervention_id,
        message: 'Your mentor has assigned a remedial task. Complete it to unlock full access.'
      });
    }

    return res.status(200).json({
      message: 'Intervention assigned successfully. Student unlocked with remedial task.',
      intervention,
      student_status: 'remedial_assigned'
    });

  } catch (error) {
    console.error('Error in assignIntervention:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Endpoint for student to mark remedial task as complete
export const completeRemedialTask = async (req: Request, res: Response) => {
  try {
    const { student_id, intervention_id } = req.body;

    if (!student_id || !intervention_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: student_id, intervention_id' 
      });
    }

    // Update intervention as completed
    const { data: intervention, error: interventionError } = await supabaseAdmin
      .from('interventions')
      .update({
        status: 'completed',
        task_completed: true,
        task_completed_at: new Date().toISOString()
      })
      .eq('id', intervention_id)
      .eq('student_id', student_id)
      .select()
      .single();

    if (interventionError || !intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    // Return student to normal state
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ status: 'on_track' })
      .eq('id', student_id);

    if (updateError) {
      console.error('Error updating student status:', updateError);
      return res.status(500).json({ error: 'Failed to update student status' });
    }

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${student_id}`).emit('task_completed', {
        status: 'on_track',
        message: 'Great! You have completed your remedial task. You are back on track.'
      });
    }

    return res.status(200).json({
      message: 'Remedial task completed. Student returned to normal state.',
      student_status: 'on_track'
    });

  } catch (error) {
    console.error('Error in completeRemedialTask:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current student status and active intervention
export const getStudentStatus = async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;

    if (!student_id) {
      return res.status(400).json({ error: 'Missing student_id parameter' });
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

    // Fetch active intervention if exists
    let activeIntervention = null;
    if (student.status !== 'on_track') {
      const { data: intervention } = await supabaseAdmin
        .from('interventions')
        .select('*')
        .eq('student_id', student_id)
        .in('status', ['pending', 'assigned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      activeIntervention = intervention;
    }

    return res.status(200).json({
      student,
      active_intervention: activeIntervention
    });

  } catch (error) {
    console.error('Error in getStudentStatus:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

