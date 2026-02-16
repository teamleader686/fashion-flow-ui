-- ============================================
-- SYNC INSTAGRAM USERS WITH AUTH
-- ============================================

-- 1. Add auth_user_id to instagram_users
ALTER TABLE instagram_users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- 2. Update RLS policies to use auth_user_id
DROP POLICY IF EXISTS "Instagram users can view their own data" ON instagram_users;
CREATE POLICY "Instagram users can view their own data"
  ON instagram_users FOR SELECT
  USING (
    id = auth.uid() OR auth_user_id = auth.uid()
  );

-- Update other policies if necessary
DROP POLICY IF EXISTS "Instagram users can view their assignments" ON instagram_assignments;
CREATE POLICY "Instagram users can view their assignments"
  ON instagram_assignments FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM instagram_users 
      WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instagram users can view their coin logs" ON instagram_coin_logs;
CREATE POLICY "Instagram users can view their coin logs"
  ON instagram_coin_logs FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM instagram_users 
      WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  );

-- 3. Update existing records (optional, but helps if any IDs happened to match)
UPDATE instagram_users SET auth_user_id = id WHERE auth_user_id IS NULL AND id IN (SELECT id FROM auth.users);
