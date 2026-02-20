-- =====================================================================
-- COMPLETE BACKUP SYSTEM MIGRATION (Run this in Supabase SQL Editor)
-- =====================================================================

-- ─── 1. database_backups table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.database_backups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name        text NOT NULL,
  file_url         text,
  file_size        numeric NOT NULL DEFAULT 0,
  status           text NOT NULL,       -- 'pending' | 'success' | 'failed'
  tables_included  text[] NOT NULL DEFAULT '{}',
  created_at       timestamp with time zone DEFAULT now()
);

ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to manage backups" ON public.database_backups;
CREATE POLICY "Allow authenticated users to manage backups"
ON public.database_backups FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 2. admin_settings table (stores email, token etc.) ──────────────
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  value      text,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to manage admin_settings" ON public.admin_settings;
CREATE POLICY "Allow authenticated users to manage admin_settings"
ON public.admin_settings FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 3. Create the storage bucket for backup files ───────────────────
-- This creates the 'backups' bucket in Supabase Storage (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups',
  'backups',
  true,
  52428800,   -- 50 MB max file size
  ARRAY[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Storage RLS: allow authenticated users to upload/read ────────
DROP POLICY IF EXISTS "Allow auth users to upload backups" ON storage.objects;
CREATE POLICY "Allow auth users to upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backups');

DROP POLICY IF EXISTS "Allow public to read backups" ON storage.objects;
CREATE POLICY "Allow public to read backups"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'backups');

DROP POLICY IF EXISTS "Allow auth users to delete backups" ON storage.objects;
CREATE POLICY "Allow auth users to delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'backups');
