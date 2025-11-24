-- Alcovia Intervention Engine - Database Schema
-- This schema implements the three-state intervention system:
-- 1. Normal State: Student is on track
-- 2. Locked State: Student needs intervention, waiting for mentor
-- 3. Remedial State: Student has assigned task from mentor

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'on_track' CHECK (status IN ('on_track', 'needs_intervention', 'remedial_assigned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Logs Table (Focus Time & Quiz Scores)
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    quiz_score INTEGER NOT NULL CHECK (quiz_score >= 0 AND quiz_score <= 10),
    focus_minutes NUMERIC(10, 2) NOT NULL CHECK (focus_minutes >= 0),
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed')),
    tab_switches INTEGER DEFAULT 0,
    cheating_detected BOOLEAN DEFAULT FALSE,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Interventions Table (Mentor Actions & Remedial Tasks)
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    daily_log_id UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
    mentor_notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mentor_responded_at TIMESTAMP WITH TIME ZONE,
    remedial_task TEXT,
    task_completed BOOLEAN DEFAULT FALSE,
    task_completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'auto_resolved')),
    n8n_execution_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_student_id ON daily_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_logged_at ON daily_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_interventions_student_id ON interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Insert a demo student for testing
INSERT INTO students (id, email, name, status) 
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'student@alcovia.com', 'Demo Student', 'on_track')
ON CONFLICT (email) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interventions_updated_at ON interventions;
CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON interventions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

