-- ============================================
-- FIX INSTAGRAM MARKETING SCHEMA ERRORS
-- ============================================
-- This file fixes the "column status does not exist" error
-- and other RLS policy issues
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing policies that reference wrong table
DROP POLICY IF EXISTS "Admin can manage all instagram users" ON instagram_users;
DROP POLICY IF EXISTS "Admin can manage all campaigns" ON instagram_campaigns;
DROP POLICY IF EXISTS "Admin can manage all assignments" ON instagram_assignments;
DROP POLICY IF EXISTS "Admin can manage all coin logs" ON instagram_coin_logs;
DROP POLICY IF EXISTS "Users can view their notifications" ON instagram_notifications;
DROP POLICY IF EXISTS "Admin can manage notifications" ON instagram_notifications;

-- Step 2: Recreate policies with correct table reference (user_profiles instead of profiles)

-- Instagram Users Policies
CREATE POLICY "Admin can manage all instagram users"
  ON instagram_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view their own data"
  ON instagram_users FOR SELECT
  USING (id = auth.uid());

-- Instagram Campaigns Policies
CREATE POLICY "Admin can manage all campaigns"
  ON instagram_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view assigned campaigns"
  ON instagram_campaigns FOR SELECT
  USING (
    id IN (
      SELECT campaign_id FROM instagram_assignments
      WHERE user_id = auth.uid()
    )
  );

-- Instagram Assignments Policies
CREATE POLICY "Admin can manage all assignments"
  ON instagram_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view their assignments"
  ON instagram_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Instagram Coin Logs Policies
CREATE POLICY "Admin can manage all coin logs"
  ON instagram_coin_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view their coin logs"
  ON instagram_coin_logs FOR SELECT
  USING (user_id = auth.uid());

-- Instagram Notifications Policies
CREATE POLICY "Users can view their notifications"
  ON instagram_notifications FOR SELECT
  USING (
    (recipient_type = 'admin' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    ))
    OR
    (recipient_type = 'instagram_user' AND recipient_id = auth.uid())
  );

CREATE POLICY "Admin can manage notifications"
  ON instagram_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if all tables exist
SELECT 
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_users') as instagram_users_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_campaigns') as instagram_campaigns_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_assignments') as instagram_assignments_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_coin_logs') as instagram_coin_logs_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_notifications') as instagram_notifications_exists;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename LIKE 'instagram_%'
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If no errors, Instagram Marketing schema is now fixed!
-- All RLS policies now correctly reference user_profiles table
