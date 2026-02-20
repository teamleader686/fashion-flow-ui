-- Add admin_settings table to store Google OAuth tokens securely
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access to admin_settings"
ON public.admin_settings
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Helper: upsert setting value
CREATE OR REPLACE FUNCTION upsert_admin_setting(p_key text, p_val text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_settings (key, value, updated_at)
    VALUES (p_key, p_val, now())
  ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$;
