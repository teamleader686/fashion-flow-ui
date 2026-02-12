-- ============================================
-- 🌐 WEBSITE SETTINGS & DYNAMIC CONTENT SYSTEM
-- ============================================

-- STEP 1: Drop existing tables if any
DROP TABLE IF EXISTS feature_toggles CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS homepage_sliders CASCADE;
DROP TABLE IF EXISTS website_settings CASCADE;

-- STEP 2: Create WEBSITE_SETTINGS table (Key-Value store)
CREATE TABLE website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json', 'image', 'color')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'branding', 'contact', 'social', 'footer', 'seo', 'theme', 'announcement')),
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Create HOMEPAGE_SLIDERS table
CREATE TABLE homepage_sliders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Create BANNERS table
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link TEXT,
  section TEXT DEFAULT 'top' CHECK (section IN ('top', 'middle', 'bottom', 'sidebar')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: Create FEATURE_TOGGLES table
CREATE TABLE feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 6: Create indexes
CREATE INDEX idx_website_settings_key ON website_settings(setting_key);
CREATE INDEX idx_website_settings_category ON website_settings(category);
CREATE INDEX idx_homepage_sliders_status ON homepage_sliders(status);
CREATE INDEX idx_homepage_sliders_order ON homepage_sliders(display_order);
CREATE INDEX idx_banners_status ON banners(status);
CREATE INDEX idx_banners_section ON banners(section);
CREATE INDEX idx_banners_order ON banners(display_order);
CREATE INDEX idx_feature_toggles_key ON feature_toggles(feature_key);

-- STEP 7: Insert default settings
INSERT INTO website_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- General Settings
('website_name', 'Fashion Flow', 'text', 'general', 'Website name'),
('website_tagline', 'Your Style, Your Way', 'text', 'general', 'Website tagline'),
('website_logo', '', 'image', 'branding', 'Website logo URL'),
('website_favicon', '', 'image', 'branding', 'Website favicon URL'),

-- Contact Settings
('contact_email', 'support@fashionflow.com', 'text', 'contact', 'Primary contact email'),
('support_phone', '+91 1234567890', 'text', 'contact', 'Customer support phone'),
('whatsapp_number', '+91 1234567890', 'text', 'contact', 'WhatsApp number'),
('business_address', '123 Fashion Street, Mumbai, India', 'text', 'contact', 'Business address'),
('business_hours', 'Mon-Sat: 10AM-8PM', 'text', 'contact', 'Business hours'),

-- Social Media
('facebook_url', 'https://facebook.com/fashionflow', 'text', 'social', 'Facebook page URL'),
('instagram_url', 'https://instagram.com/fashionflow', 'text', 'social', 'Instagram profile URL'),
('twitter_url', 'https://twitter.com/fashionflow', 'text', 'social', 'Twitter profile URL'),
('youtube_url', 'https://youtube.com/fashionflow', 'text', 'social', 'YouTube channel URL'),
('linkedin_url', '', 'text', 'social', 'LinkedIn profile URL'),

-- Footer Settings
('footer_about', 'Fashion Flow is your one-stop destination for trendy fashion.', 'text', 'footer', 'About us text in footer'),
('footer_copyright', '© 2024 Fashion Flow. All rights reserved.', 'text', 'footer', 'Copyright text'),

-- SEO Settings
('meta_title', 'Fashion Flow - Trendy Fashion Online', 'text', 'seo', 'Default meta title'),
('meta_description', 'Shop the latest fashion trends online at Fashion Flow', 'text', 'seo', 'Default meta description'),
('meta_keywords', 'fashion, clothing, online shopping, trendy', 'text', 'seo', 'Default meta keywords'),
('og_image', '', 'image', 'seo', 'Open Graph default image'),

-- Theme Settings
('primary_color', '#EC4899', 'color', 'theme', 'Primary brand color'),
('secondary_color', '#9333EA', 'color', 'theme', 'Secondary brand color'),
('accent_color', '#F59E0B', 'color', 'theme', 'Accent color'),
('dark_mode_enabled', 'false', 'boolean', 'theme', 'Enable dark mode'),

-- Announcement Bar
('announcement_enabled', 'true', 'boolean', 'announcement', 'Enable announcement bar'),
('announcement_text', '🎉 Free shipping on orders above ₹999!', 'text', 'announcement', 'Announcement message'),
('announcement_link', '/offers', 'text', 'announcement', 'Announcement link'),
('announcement_bg_color', '#EC4899', 'color', 'announcement', 'Announcement background color')

ON CONFLICT (setting_key) DO NOTHING;

-- STEP 8: Insert default feature toggles
INSERT INTO feature_toggles (feature_key, feature_name, enabled, description) VALUES
('loyalty_coins', 'Loyalty Coins System', true, 'Enable/disable loyalty coins earning and redemption'),
('affiliate_marketing', 'Affiliate Marketing', true, 'Enable/disable affiliate marketing program'),
('instagram_marketing', 'Instagram Marketing', true, 'Enable/disable Instagram marketing campaigns'),
('coupon_system', 'Coupon System', true, 'Enable/disable coupon codes'),
('offer_system', 'Offer System', true, 'Enable/disable product offers and deals'),
('wallet_system', 'Wallet System', true, 'Enable/disable user wallet'),
('mobile_repair', 'Mobile Repair Module', false, 'Enable/disable mobile repair services'),
('mobile_recharge', 'Mobile Recharge Module', false, 'Enable/disable mobile recharge')

ON CONFLICT (feature_key) DO NOTHING;

-- STEP 9: Function to get setting value
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT setting_value INTO v_value
  FROM website_settings
  WHERE setting_key = p_key;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Function to update setting
CREATE OR REPLACE FUNCTION update_setting(
  p_key TEXT,
  p_value TEXT,
  p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE website_settings
  SET 
    setting_value = p_value,
    updated_by = p_updated_by,
    updated_at = NOW()
  WHERE setting_key = p_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: Function to check if feature is enabled
CREATE OR REPLACE FUNCTION is_feature_enabled(p_feature_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT enabled INTO v_enabled
  FROM feature_toggles
  WHERE feature_key = p_feature_key;
  
  RETURN COALESCE(v_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 12: Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_settings_timestamp
BEFORE UPDATE ON website_settings
FOR EACH ROW
EXECUTE FUNCTION update_settings_timestamp();

CREATE TRIGGER trigger_update_sliders_timestamp
BEFORE UPDATE ON homepage_sliders
FOR EACH ROW
EXECUTE FUNCTION update_settings_timestamp();

CREATE TRIGGER trigger_update_banners_timestamp
BEFORE UPDATE ON banners
FOR EACH ROW
EXECUTE FUNCTION update_settings_timestamp();

CREATE TRIGGER trigger_update_features_timestamp
BEFORE UPDATE ON feature_toggles
FOR EACH ROW
EXECUTE FUNCTION update_settings_timestamp();

-- STEP 13: Enable RLS
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;

-- STEP 14: RLS Policies for website_settings
CREATE POLICY "Public can view settings"
ON website_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can manage settings"
ON website_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- STEP 15: RLS Policies for homepage_sliders
CREATE POLICY "Public can view active sliders"
ON homepage_sliders FOR SELECT
TO anon, authenticated
USING (status = 'active');

CREATE POLICY "Admin can manage sliders"
ON homepage_sliders FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- STEP 16: RLS Policies for banners
CREATE POLICY "Public can view active banners"
ON banners FOR SELECT
TO anon, authenticated
USING (
  status = 'active' 
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
);

CREATE POLICY "Admin can manage banners"
ON banners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- STEP 17: RLS Policies for feature_toggles
CREATE POLICY "Public can view feature toggles"
ON feature_toggles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can manage feature toggles"
ON feature_toggles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- ============================================
-- ✅ WEBSITE SETTINGS SYSTEM COMPLETE!
-- ============================================
-- Features included:
-- ✅ Dynamic website settings (key-value store)
-- ✅ Homepage sliders with ordering
-- ✅ Banner management with sections
-- ✅ Feature toggles for modules
-- ✅ Helper functions for easy access
-- ✅ RLS security policies
-- ✅ Auto-update timestamps
-- ============================================
