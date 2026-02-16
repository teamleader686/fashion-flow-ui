-- ============================================
-- 🚀 RUN THIS SCRIPT IN SUPABASE SQL EDITOR
-- This version handles existing policies gracefully (Idempotent)
-- ============================================

-- 1. Create storage_logs table
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
CREATE INDEX IF NOT EXISTS idx_storage_logs_user_id ON storage_logs(user_id);

-- 2. Create user_storage_usage table
CREATE TABLE IF NOT EXISTS user_storage_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    total_kb NUMERIC NOT NULL DEFAULT 0,
    upload_count INTEGER NOT NULL DEFAULT 0,
    last_upload_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create product_reviews table
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

-- 4. Add avatar_url to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 5-9. Analytics Functions (RPCs)
CREATE OR REPLACE FUNCTION get_storage_by_module()
RETURNS TABLE (module TEXT, total_kb NUMERIC, log_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT module, COALESCE(SUM(size_kb), 0) as total_kb, COUNT(*) as log_count
  FROM storage_logs
  GROUP BY module
  ORDER BY total_kb DESC;
$$;

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

-- 10. Enable RLS
ALTER TABLE storage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- 11. Security Policies (Drop first to avoid errors)

-- Product Reviews Policies
DROP POLICY IF EXISTS "Public read reviews" ON product_reviews;
CREATE POLICY "Public read reviews" ON product_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create reviews" ON product_reviews;
CREATE POLICY "Users create reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage Logs Policies
DROP POLICY IF EXISTS "Admin read logs" ON storage_logs;
CREATE POLICY "Admin read logs" ON storage_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Everyone insert logs" ON storage_logs;
CREATE POLICY "Everyone insert logs" ON storage_logs FOR INSERT WITH CHECK (true);

-- User Storage Usage Policies
DROP POLICY IF EXISTS "Users read own usage" ON user_storage_usage;
CREATE POLICY "Users read own usage" ON user_storage_usage FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System update usage" ON user_storage_usage;
CREATE POLICY "System update usage" ON user_storage_usage FOR ALL USING (true);

-- ✅ Final Success Message
SELECT 'Storage Monitoring System Setup Complete (All Errors Fixed)! 🚀' as status;
