ALTER TABLE organization ADD COLUMN IF NOT EXISTS whitelisted_domains text[] DEFAULT '{}';
