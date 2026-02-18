-- Update all user passwords to correct bcrypt hash for 'password123'
-- Run this in Supabase SQL Editor to fix login issues

UPDATE users 
SET password = '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq',
    "updatedAt" = NOW();

-- Verify the update
SELECT 
    email, 
    name, 
    role,
    CASE 
        WHEN password = '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq' THEN '✅ Correct'
        ELSE '❌ Wrong'
    END as password_status
FROM users
ORDER BY role DESC, email;
