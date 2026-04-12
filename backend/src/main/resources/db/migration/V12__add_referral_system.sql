-- Referral system: each user gets a unique code and can track who invited them.
ALTER TABLE users
    ADD COLUMN referral_code VARCHAR(12) UNIQUE,
    ADD COLUMN referred_by  BIGINT REFERENCES users(id),
    ADD COLUMN display_name VARCHAR(50);

-- Generate referral codes for existing users
-- (8-char uppercase alphanumeric derived from id + random seed)
UPDATE users
SET referral_code = UPPER(SUBSTR(MD5(id::text || 'crafttree'), 1, 8));

-- Make referral_code NOT NULL going forward
ALTER TABLE users ALTER COLUMN referral_code SET NOT NULL;

CREATE INDEX idx_users_referral_code ON users (referral_code);
CREATE INDEX idx_users_referred_by  ON users (referred_by);
