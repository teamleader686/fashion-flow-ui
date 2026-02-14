-- Create sliders table
CREATE TABLE IF NOT EXISTS sliders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    redirect_url TEXT,
    display_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sliders ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view active sliders" 
ON sliders FOR SELECT 
TO anon, authenticated 
USING (status = 'active');

-- Admin full access
CREATE POLICY "Admins have full access to sliders" 
ON sliders FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sliders_updated_at
BEFORE UPDATE ON sliders
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create storage bucket for sliders if it doesn't exist
-- Note: This usually needs to be done via Supabase Dashboard or API
-- But we can add it to the documentation/instructions.
