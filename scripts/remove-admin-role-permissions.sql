-- Remove all admin role permissions (keep only super_admin, hiring_manager, recruiter)
DELETE FROM role_permissions WHERE role = 'admin';

-- Verify remaining roles
SELECT DISTINCT role FROM role_permissions ORDER BY role;
