-- ============================================
-- INSTAGRAM MARKETING MODULE - COMPLETE SCHEMA
-- ============================================

-- 1. Instagram Users Table
CREATE TABLE IF NOT EXISTS instagram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  instagram_username TEXT UNIQUE NOT NULL,
  followers_count INTEGER NOT NULL CHECK (followers_count >= 1000),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_coins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Instagram Campaigns Table
CREATE TABLE IF NOT EXISTS instagram_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  expiry_hours INTEGER DEFAULT 24,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Instagram Assignments Table
CREATE TABLE IF NOT EXISTS instagram_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES instagram_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES instagram_users(id) ON DELETE CASCADE,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- 4. Instagram Coin Logs Table
CREATE TABLE IF NOT EXISTS instagram_coin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES instagram_users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL,
  reason TEXT NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  running_balance INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Instagram Notifications Table
CREATE TABLE IF NOT EXISTS instagram_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('story_expiry', 'coins_assigned', 'campaign_assigned')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('admin', 'instagram_user')),
  recipient_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  assignment_id UUID REFERENCES instagram_assignments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_instagram_users_status ON instagram_users(status);
CREATE INDEX IF NOT EXISTS idx_instagram_users_email ON instagram_users(email);
CREATE INDEX IF NOT EXISTS idx_instagram_campaigns_status ON instagram_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_instagram_assignments_user ON instagram_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_assignments_campaign ON instagram_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_instagram_assignments_expiry ON instagram_assignments(expiry_date);
CREATE INDEX IF NOT EXISTS idx_instagram_coin_logs_user ON instagram_coin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_notifications_recipient ON instagram_notifications(recipient_id, recipient_type);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_instagram_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_instagram_users_updated_at
  BEFORE UPDATE ON instagram_users
  FOR EACH ROW EXECUTE FUNCTION update_instagram_updated_at();

CREATE TRIGGER update_instagram_campaigns_updated_at
  BEFORE UPDATE ON instagram_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_instagram_updated_at();

-- Auto-update total coins when coin log is added
CREATE OR REPLACE FUNCTION update_instagram_user_coins()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE instagram_users
  SET total_coins = (
    SELECT COALESCE(SUM(coins), 0)
    FROM instagram_coin_logs
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_coins_on_log
  AFTER INSERT ON instagram_coin_logs
  FOR EACH ROW EXECUTE FUNCTION update_instagram_user_coins();

-- Auto-expire assignments
CREATE OR REPLACE FUNCTION check_instagram_assignment_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date <= NOW() AND NEW.status = 'active' THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_assignment_expiry
  BEFORE UPDATE ON instagram_assignments
  FOR EACH ROW EXECUTE FUNCTION check_instagram_assignment_expiry();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE instagram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_coin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_notifications ENABLE ROW LEVEL SECURITY;

-- Instagram Users Policies
CREATE POLICY "Admin can manage all instagram users"
  ON instagram_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view their own data"
  ON instagram_users FOR SELECT
  USING (id = auth.uid());

-- Instagram Campaigns Policies
CREATE POLICY "Admin can manage all campaigns"
  ON instagram_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view assigned campaigns"
  ON instagram_campaigns FOR SELECT
  USING (
    id IN (
      SELECT campaign_id FROM instagram_assignments
      WHERE user_id = auth.uid()
    )
  );

-- Instagram Assignments Policies
CREATE POLICY "Admin can manage all assignments"
  ON instagram_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view their assignments"
  ON instagram_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Instagram Coin Logs Policies
CREATE POLICY "Admin can manage all coin logs"
  ON instagram_coin_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Instagram users can view their coin logs"
  ON instagram_coin_logs FOR SELECT
  USING (user_id = auth.uid());

-- Instagram Notifications Policies
CREATE POLICY "Users can view their notifications"
  ON instagram_notifications FOR SELECT
  USING (
    (recipient_type = 'admin' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    ))
    OR
    (recipient_type = 'instagram_user' AND recipient_id = auth.uid())
  );

CREATE POLICY "Admin can manage notifications"
  ON instagram_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create expiry reminder notifications
CREATE OR REPLACE FUNCTION create_expiry_reminders()
RETURNS void AS $$
BEGIN
  INSERT INTO instagram_notifications (
    notification_type,
    recipient_type,
    title,
    message,
    assignment_id
  )
  SELECT
    'story_expiry',
    'admin',
    'Story Expiring Soon',
    'Campaign "' || c.campaign_title || '" for @' || iu.instagram_username || ' expires in 1 hour',
    ia.id
  FROM instagram_assignments ia
  JOIN instagram_campaigns c ON ia.campaign_id = c.id
  JOIN instagram_users iu ON ia.user_id = iu.id
  WHERE ia.status = 'active'
    AND ia.reminder_sent = FALSE
    AND ia.expiry_date <= NOW() + INTERVAL '1 hour'
    AND ia.expiry_date > NOW();

  -- Mark reminders as sent
  UPDATE instagram_assignments
  SET reminder_sent = TRUE
  WHERE status = 'active'
    AND reminder_sent = FALSE
    AND expiry_date <= NOW() + INTERVAL '1 hour'
    AND expiry_date > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign coins
CREATE OR REPLACE FUNCTION assign_instagram_coins(
  p_user_id UUID,
  p_coins INTEGER,
  p_reason TEXT,
  p_assigned_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_log_id UUID;
BEGIN
  -- Get current balance
  SELECT COALESCE(total_coins, 0) INTO v_current_balance
  FROM instagram_users
  WHERE id = p_user_id;

  -- Insert coin log
  INSERT INTO instagram_coin_logs (
    user_id,
    coins,
    reason,
    assigned_by,
    running_balance
  ) VALUES (
    p_user_id,
    p_coins,
    p_reason,
    p_assigned_by,
    v_current_balance + p_coins
  ) RETURNING id INTO v_new_log_id;

  -- Create notification
  INSERT INTO instagram_notifications (
    notification_type,
    recipient_type,
    recipient_id,
    title,
    message
  ) VALUES (
    'coins_assigned',
    'instagram_user',
    p_user_id,
    'Coins Credited',
    'You received ' || p_coins || ' coins. Reason: ' || p_reason
  );

  RETURN v_new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

CREATE OR REPLACE VIEW instagram_analytics AS
SELECT
  (SELECT COUNT(*) FROM instagram_users WHERE status = 'active') as total_active_users,
  (SELECT COUNT(*) FROM instagram_campaigns) as total_campaigns,
  (SELECT COALESCE(SUM(coins), 0) FROM instagram_coin_logs) as total_coins_distributed,
  (SELECT COUNT(*) FROM instagram_assignments WHERE status = 'active') as active_stories,
  (SELECT COUNT(*) FROM instagram_assignments WHERE status = 'expired') as expired_stories,
  (SELECT COUNT(*) FROM instagram_assignments WHERE status = 'completed') as completed_stories;

-- Grant access to analytics view
GRANT SELECT ON instagram_analytics TO authenticated;
