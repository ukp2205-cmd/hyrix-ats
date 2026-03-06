-- Seed Domain Whitelisting permission for super_admin (Yes by default)
INSERT INTO role_permissions (role, module, access_level)
VALUES ('super_admin', 'Domain Whitelisting', 'Full')
ON CONFLICT (role, module) DO UPDATE SET access_level = 'Full';
