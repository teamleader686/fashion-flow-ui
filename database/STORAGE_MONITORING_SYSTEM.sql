-- ============================================
-- 📦 COMPLETE STORAGE MONITORING SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- 1️⃣ Create storage_logs table
CREATE TABLE IF NOT EXISTS storage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  bucket_name TEXT,
  file_path TEXT,
  size_kb NUMERIC NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast aggregation queries
CREATE INDEX IF NOT EXISTS idx_storage_logs_module ON storage_logs(module);
CREATE INDEX IF NOT EXISTS idx_storage_logs_created_at ON storage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_logs_user_id ON storage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_logs_action ON storage_logs(action);

-- 2️⃣ Create user_storage_usage table
CREATE TABLE IF NOT EXISTS user_storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  total_kb NUMERIC NOT NULL DEFAULT 0,
  upload_count INTEGER NOT NULL DEFAULT 0,
  last_upload_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON user_storage_usage(user_id);

-- 3️⃣ RLS Policies
ALTER TABLE storage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage_usage ENABLE ROW LEVEL SECURITY;

-- Storage logs: Admin can read all, system can insert
CREATE POLICY "Admin can read storage logs" ON storage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert storage logs" ON storage_logs
  FOR INSERT WITH CHECK (true);

-- User storage usage: Users can see their own, admin can see all
CREATE POLICY "Users can read own storage usage" ON user_storage_usage
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can upsert storage usage" ON user_storage_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update storage usage" ON user_storage_usage
  FOR UPDATE USING (true);

-- 4️⃣ RPC: Get module-wise storage breakdown
CREATE OR REPLACE FUNCTION get_storage_by_module()
RETURNS TABLE (module TEXT, total_kb NUMERIC, log_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT module, COALESCE(SUM(size_kb), 0) as total_kb, COUNT(*) as log_count
  FROM storage_logs
  GROUP BY module
  ORDER BY total_kb DESC;
$$;

-- 5️⃣ RPC: Get daily storage usage (last 30 days)
CREATE OR REPLACE FUNCTION get_daily_storage_usage(days_back INTEGER DEFAULT 30)
RETURNS TABLE (day DATE, total_kb NUMERIC, upload_count BIGINT, delete_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    DATE(created_at) as day,
    COALESCE(SUM(size_kb), 0) as total_kb,
    COUNT(*) FILTER (WHERE action IN ('upload', 'create')) as upload_count,
    COUNT(*) FILTER (WHERE action IN ('delete', 'remove')) as delete_count
  FROM storage_logs
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY day ASC;
$$;

-- 6️⃣ RPC: Get top storage consumers
CREATE OR REPLACE FUNCTION get_top_storage_usage(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (module TEXT, action TEXT, size_kb NUMERIC, record_id TEXT, file_path TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE
AS $$
  SELECT module, action, size_kb, record_id, file_path, created_at
  FROM storage_logs
  WHERE size_kb > 0
  ORDER BY size_kb DESC
  LIMIT limit_count;
$$;

-- 7️⃣ RPC: Get total storage from logs
CREATE OR REPLACE FUNCTION get_total_storage_from_logs()
RETURNS TABLE (total_kb NUMERIC, total_uploads BIGINT, total_deletes BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(SUM(size_kb), 0) as total_kb,
    COUNT(*) FILTER (WHERE size_kb > 0) as total_uploads,
    COUNT(*) FILTER (WHERE size_kb < 0) as total_deletes
  FROM storage_logs;
$$;

-- 8️⃣ RPC: Get user storage summary
CREATE OR REPLACE FUNCTION get_user_storage_summary(p_user_id UUID)
RETURNS TABLE (total_kb NUMERIC, upload_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(SUM(size_kb), 0) as total_kb,
    COUNT(*) FILTER (WHERE size_kb > 0) as upload_count
  FROM storage_logs
  WHERE user_id = p_user_id;
$$;

-- ✅ Done!
SELECT 'Storage Monitoring System installed successfully!' as status;
