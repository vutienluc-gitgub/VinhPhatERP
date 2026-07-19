-- Add pending_qc to roll_status enum
ALTER TYPE roll_status ADD VALUE IF NOT EXISTS 'pending_qc';
