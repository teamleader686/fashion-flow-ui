-- ============================================
-- 📸 INSTAGRAM TRACKING SYSTEM MIGRATION
-- ============================================

-- 1. Update instagram_campaigns table
ALTER TABLE instagram_campaigns 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS campaign_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'instagram',
ADD COLUMN IF NOT EXISTS medium TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update 'name' column if 'campaign_title' exists and 'name' is null
UPDATE instagram_campaigns 
SET name = campaign_title 
WHERE name IS NULL AND campaign_title IS NOT NULL;

-- 2. Create campaign_clicks table
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid REFERENCES instagram_campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at timestamp with time zone default now()
);

-- 3. Create campaign_orders table
CREATE TABLE IF NOT EXISTS campaign_orders (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid REFERENCES instagram_campaigns(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  revenue numeric,
  created_at timestamp with time zone default now(),
  UNIQUE(order_id) -- One order can only be attributed to one campaign for this specific tracking
);

-- 4. Enable RLS
ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_orders ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Admin can view/manage all
CREATE POLICY "Admin can manage all campaign_clicks" 
  ON campaign_clicks FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = 'admin'));

CREATE POLICY "Admin can manage all campaign_orders" 
  ON campaign_orders FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = 'admin'));

-- Anyone can insert clicks (public tracking)
CREATE POLICY "Anyone can insert campaign_clicks" 
  ON campaign_clicks FOR INSERT 
  WITH CHECK (true);

-- 6. Add Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_id ON campaign_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_orders_campaign_id ON campaign_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_instagram_campaigns_code ON instagram_campaigns(campaign_code);
