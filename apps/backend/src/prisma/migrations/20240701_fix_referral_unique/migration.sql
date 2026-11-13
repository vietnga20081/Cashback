-- Migration: Fix referral table unique constraint
-- Change from: toUserId UNIQUE (only 1 record per referred user)
-- Change to:   (toUserId, level) UNIQUE (1 record per level per referred user, allowing F1+F2+F3)

-- Step 1: Drop the old unique index on toUserId
ALTER TABLE `referrals` DROP INDEX `referrals_toUserId_key`;

-- Step 2: Add compound unique index on (toUserId, level)
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_toUserId_level_key` UNIQUE (`toUserId`, `level`);

-- Step 3: Add index on toUserId for query performance
CREATE INDEX `referrals_toUserId_idx` ON `referrals`(`toUserId`);
