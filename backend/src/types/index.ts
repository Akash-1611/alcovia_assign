// Type Definitions for Alcovia Intervention Engine

export interface Student {
  id: string;
  email: string;
  name: string;
  status: 'on_track' | 'needs_intervention' | 'remedial_assigned';
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  student_id: string;
  quiz_score: number;
  focus_minutes: number;
  status: 'success' | 'failed';
  tab_switches?: number;
  cheating_detected?: boolean;
  logged_at: string;
  notes?: string;
}

export interface Intervention {
  id: string;
  student_id: string;
  daily_log_id?: string;
  mentor_notified_at: string;
  mentor_responded_at?: string;
  remedial_task?: string;
  task_completed: boolean;
  task_completed_at?: string;
  status: 'pending' | 'assigned' | 'completed' | 'auto_resolved';
  n8n_execution_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckinRequest {
  student_id: string;
  quiz_score: number;
  focus_minutes: number;
  tab_switches?: number;
  cheating_detected?: boolean;
}

export interface DailyCheckinResponse {
  status: 'On Track' | 'Pending Mentor Review';
  message: string;
  student_status: Student['status'];
  intervention_id?: string;
}

export interface AssignInterventionRequest {
  student_id: string;
  intervention_id: string;
  remedial_task: string;
}

export interface N8nWebhookPayload {
  student_id: string;
  student_name: string;
  student_email: string;
  quiz_score: number;
  focus_minutes: number;
  daily_log_id: string;
  intervention_id: string;
  tab_switches?: number;
  cheating_detected?: boolean;
}

