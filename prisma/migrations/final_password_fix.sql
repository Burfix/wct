-- FINAL PASSWORD FIX - Run this in Supabase SQL Editor
-- This will update ALL users to use the correct password hash for 'password123'

-- First, verify current state
SELECT 
    email,
    role,
    CASE 
        WHEN password = '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq' THEN '✅ Already correct'
        ELSE '❌ Needs update'
    END as status
FROM users
ORDER BY role DESC, email;

-- Update ALL passwords to the correct hash
UPDATE users 
SET password = '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq',
    "updatedAt" = NOW()
WHERE password != '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq';

-- Verify the fix worked
SELECT 
    email,
    role,
    LEFT(password, 30) || '...' as password_hash,
    CASE 
        WHEN password = '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq' THEN '✅ CORRECT - password123 will work'
        ELSE '❌ WRONG - will not work'
    END as verification
FROM users
ORDER BY role DESC, email;

-- Expected result: All users should show '✅ CORRECT - password123 will work'
