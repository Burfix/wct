-- Debug: Check what users exist and verify password hash
SELECT 
    id,
    email, 
    name, 
    role,
    active,
    LEFT(password, 20) || '...' as password_start,
    LENGTH(password) as password_length,
    CASE 
        WHEN password LIKE '$2b$%' THEN '✅ bcrypt $2b (correct)'
        WHEN password LIKE '$2a$%' THEN '⚠️ bcrypt $2a (old format)'
        WHEN password LIKE '$2y$%' THEN '⚠️ bcrypt $2y'
        ELSE '❌ Not bcrypt format'
    END as hash_format,
    "createdAt",
    "updatedAt"
FROM users
ORDER BY role DESC, email;
