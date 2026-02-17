-- ============================================================================
-- LEGAL & SUPPORT SYSTEM SETUP
-- ============================================================================

-- 1. Create Pages Table (Terms, Privacy, etc.)
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- Rich text content
  is_active BOOLEAN DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Pages
INSERT INTO public.pages (slug, title, content) VALUES
('terms', 'Terms & Conditions', '<h1>Terms & Conditions</h1><p>Welcome to our website. Please read these terms carefully...</p>'),
('privacy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>'),
('refund', 'Refund & Return Policy', '<h1>Refund Policy</h1><p>We offer a 7-day return policy...</p>'),
('shipping', 'Shipping Policy', '<h1>Shipping Policy</h1><p>We ship within 2-3 business days...</p>'),
('cancellation', 'Cancellation Policy', '<h1>Cancellation Policy</h1><p>You can cancel orders before they are shipped...</p>'),
('contact', 'Contact Us', '<h1>Contact Us</h1><p>Reach us at support@example.com</p>'),
('about', 'About Us', '<h1>About Us</h1><p>We are a leading fashion brand...</p>')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create FAQ Table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- new, read, replied
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Support Tickets Table (For registered users)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, in_progress, closed
  priority TEXT DEFAULT 'normal',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Pages Policies
CREATE POLICY "Public read active pages" ON public.pages 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage pages" ON public.pages 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- FAQ Policies
CREATE POLICY "Public read active faqs" ON public.faqs 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage faqs" ON public.faqs 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Contact Messages Policies
CREATE POLICY "Public insert contact messages" ON public.contact_messages 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin manage contact messages" ON public.contact_messages 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Support Tickets Policies
CREATE POLICY "Users view own tickets" ON public.support_tickets 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tickets" ON public.support_tickets 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin manage tickets" ON public.support_tickets 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
