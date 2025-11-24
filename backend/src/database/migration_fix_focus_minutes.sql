-- Migration: Fix focus_minutes column type to accept decimal values
-- This fixes the error: invalid input syntax for type integer: "0.13333333333333333"
-- Run this in your Supabase SQL Editor

-- Change focus_minutes from INTEGER to NUMERIC(10, 2)
-- This allows decimal values like 0.13, 1.5, 60.25 etc.
ALTER TABLE daily_logs 
ALTER COLUMN focus_minutes TYPE NUMERIC(10, 2);

-- Verify the change
-- You should see focus_minutes with type: numeric(10,2)
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'daily_logs' AND column_name = 'focus_minutes';

