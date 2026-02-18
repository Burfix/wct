-- Update all user passwords with correct bcrypt hash for 'password123'
UPDATE users SET password = '$2b$10$U/3qp6taFoahxkum.BZX9.rtCUkh/zYf3NpKh/jr7bPIo7mvFsFFq';

SELECT 'Updated passwords for ' || COUNT(*) || ' users' AS message FROM users;
