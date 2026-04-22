-- FIXING ATTENDANCE INDEX
DROP INDEX IF EXISTS idx_attendance_composite;
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance(student_id, class_id, date);

-- ADDING RESET PASSWORD MOCK (to prevent 404/500 on settings)
-- No SQL needed for this, will do in worker logic.
