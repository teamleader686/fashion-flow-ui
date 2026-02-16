-- ============================================
-- 🛠️ FIX MISSING TABLES & RPCs SCRIPT
-- Run this in Supabase SQL Editor to fix 404 errors
-- ============================================

-- 1️⃣ Create product_reviews table if missing
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ Create storage_logs table
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

CREATE INDEX IF NOT EXISTS idx_storage_logs_module ON storage_logs(module);
CREATE INDEX IF NOT EXISTS idx_storage_logs_created_at ON storage_logs(created_at);

-- 3️⃣ Create user_storage_usage table
CREATE TABLE IF NOT EXISTS user_storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  total_kb NUMERIC NOT NULL DEFAULT 0,
  upload_count INTEGER NOT NULL DEFAULT 0,
  last_upload_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ RPC Functions (Analytics)

-- Get module breakdown
CREATE OR REPLACE FUNCTION get_storage_by_module()
RETURNS TABLE (module TEXT, total_kb NUMERIC, log_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT module, COALESCE(SUM(size_kb), 0) as total_kb, COUNT(*) as log_count
  FROM storage_logs
  GROUP BY module
  ORDER BY total_kb DESC;
$$;

-- Get daily usage
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

-- Get top usage
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

-- Get total logs summary
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

-- Get user storage summary
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

-- 5️⃣ Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage_usage ENABLE ROW LEVEL SECURITY;

-- Policies (Basic)
CREATE POLICY "Public read reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Users allow insert reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin read logs" ON storage_logs FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "System insert logs" ON storage_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users read own usage" ON user_storage_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System update usage" ON user_storage_usage FOR ALL USING (true);

SELECT 'All tables and functions created successfully!' as status;
