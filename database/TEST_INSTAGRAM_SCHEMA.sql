-- ============================================
-- TEST INSTAGRAM MARKETING SCHEMA
-- ============================================
-- Run this AFTER running instagram_marketing_complete_schema.sql
-- This will verify everything is working correctly
-- ============================================

-- Test 1: Check if all tables exist
SELECT 
  'instagram_users' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_users') as exists
UNION ALL
SELECT 
  'instagram_campaigns',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_campaigns')
UNION ALL
SELECT 
  'instagram_assignments',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_assignments')
UNION ALL
SELECT 
  'instagram_coin_logs',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_coin_logs')
UNION ALL
SELECT 
  'instagram_notifications',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instagram_notifications');

-- Test 2: Check table structures
SELECT 
  'instagram_users' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'instagram_users'
UNION ALL
SELECT 
  'instagram_campaigns',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'instagram_campaigns'
UNION ALL
SELECT 
  'instagram_assignments',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'instagram_assignments'
UNION ALL
SELECT 
  'instagram_coin_logs',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'instagram_coin_logs'
UNION ALL
SELECT 
  'instagram_notifications',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'instagram_notifications';

-- Test 3: Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename LIKE 'instagram_%'
ORDER BY tablename;

-- Test 4: Check policies exist
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename LIKE 'instagram_%'
GROUP BY tablename
ORDER BY tablename;

-- Test 5: Check indexes exist
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE tablename LIKE 'instagram_%'
ORDER BY tablename, indexname;

-- Test 6: Check triggers exist
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table LIKE 'instagram_%'
ORDER BY event_object_table, trigger_name;

-- Test 7: Check functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%instagram%'
ORDER BY routine_name;

-- Test 8: Try basic inserts (will fail if structure is wrong)
-- This is a dry run - we'll rollback
BEGIN;

-- Test insert into instagram_users
INSERT INTO instagram_users (
  name,
  mobile_number,
  email,
  password,
  instagram_username,
  followers_count
) VALUES (
  'Test User',
  '+919999999999',
  'test@example.com',
  'hashed_password_here',
  'test_user_123',
  5000
);

-- Test insert into instagram_campaigns
INSERT INTO instagram_campaigns (
  campaign_title,
  description,
  media_url,
  media_type
) VALUES (
  'Test Campaign',
  'This is a test campaign',
  'https://example.com/media.jpg',
  'image'
);

-- Rollback - we don't want to keep test data
ROLLBACK;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- Test 1: All should show 'true'
-- Test 2: Column counts should be:
--   - instagram_users: 11 columns
--   - instagram_campaigns: 10 columns
--   - instagram_assignments: 9 columns
--   - instagram_coin_logs: 8 columns
--   - instagram_notifications: 9 columns
-- Test 3: All should show rls_enabled = true
-- Test 4: Policy counts should be:
--   - instagram_users: 2 policies
--   - instagram_campaigns: 2 policies
--   - instagram_assignments: 2 policies
--   - instagram_coin_logs: 2 policies
--   - instagram_notifications: 2 policies
-- Test 5: Should show 8 indexes
-- Test 6: Should show 3 triggers
-- Test 7: Should show 5 functions
-- Test 8: Should complete without errors, then rollback

-- ============================================
-- If all tests pass, your schema is ready! ✅
-- ============================================
