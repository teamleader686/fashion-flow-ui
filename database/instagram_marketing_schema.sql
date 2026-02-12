-- ============================================================================
-- INSTAGRAM MARKETING MODULE - DATABASE SCHEMA
-- ============================================================================
-- Purpose: Complete Instagram influencer marketing system
-- Features: User management, campaigns, story tracking, coins, notifications
-- ============================================================================

-- ============================================================================
-- 1. INSTAGRAM USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- Encrypted password
    
    -- Instagram Info
    instagram_username VARCHAR(100) NOT NULL UNIQUE,
    instagram_profile_url TEXT,
    followers_count INTEGER NOT NULL CHECK (followers_count >= 1000),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Coins
    total_coins_earned INTEGER DEFAULT 0,
    available_coins INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Admin tracking
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_instagram_users_mobile ON public.instagram_users(mobile_number);
CREATE INDEX idx_instagram_users_email ON public.instagram_users(email);
CREATE INDEX idx_instagram_users_username ON public.instagram_users(instagram_username);
CREATE INDEX idx_instagram_users_status ON public.instagram_users(status);

-- ============================================================================
-- 2. INSTAGRAM CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign Details
    campaign_title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Media
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    
    -- Duration
    duration_hours INTEGER DEFAULT 24 CHECK (duration_hours > 0),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_instagram_campaigns_status ON public.instagram_campaigns(status);
CREATE INDEX idx_instagram_campaigns_created_at ON public.instagram_campaigns(created_at DESC);

-- ============================================================================
-- 3. INSTAGRAM STORY ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_story_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
    instagram_user_id UUID NOT NULL REFERENCES public.instagram_users(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN (
        'assigned', 'active', 'completed', 'expired', 'cancelled'
    )),
    
    -- Tracking
    viewed_by_user BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Reminder
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Unique constraint
    UNIQUE(campaign_id, instagram_user_id)
);

-- Indexes
CREATE INDEX idx_story_assignments_campaign ON public.instagram_story_assignments(campaign_id);
CREATE INDEX idx_story_assignments_user ON public.instagram_story_assignments(instagram_user_id);
CREATE INDEX idx_story_assignments_status ON public.instagram_story_assignments(status);
CREATE INDEX idx_story_assignments_expiry ON public.instagram_story_assignments(expiry_date);

-- ============================================================================
-- 4. INSTAGRAM COIN LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_coin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    instagram_user_id UUID NOT NULL REFERENCES public.instagram_users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.instagram_story_assignments(id) ON DELETE SET NULL,
    
    -- Transaction Details
    coins_amount INTEGER NOT NULL CHECK (coins_amount > 0),
    transaction_type VARCHAR(20) DEFAULT 'earned' CHECK (transaction_type IN (
        'earned', 'bonus', 'deducted', 'redeemed'
    )),
    
    -- Reason
    reason TEXT NOT NULL,
    
    -- Balance
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Admin notes
    admin_notes TEXT
);

-- Indexes
CREATE INDEX idx_coin_logs_user ON public.instagram_coin_logs(instagram_user_id);
CREATE INDEX idx_coin_logs_created_at ON public.instagram_coin_logs(created_at DESC);

-- ============================================================================
-- 5. INSTAGRAM NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'instagram_user')),
    instagram_user_id UUID REFERENCES public.instagram_users(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'story_assigned', 'story_expiring', 'story_expired', 
        'coins_assigned', 'campaign_completed'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Reference
    reference_id UUID,
    reference_type VARCHAR(50),
    
    -- Action
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_instagram_user ON public.instagram_notifications(instagram_user_id);
CREATE INDEX idx_notifications_admin_user ON public.instagram_notifications(admin_user_id);
CREATE INDEX idx_notifications_type ON public.instagram_notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON public.instagram_notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.instagram_notifications(created_at DESC);

-- ============================================================================
-- 6. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instagram_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_instagram_users_updated_at
    BEFORE UPDATE ON public.instagram_users
    FOR EACH ROW EXECUTE FUNCTION update_instagram_updated_at();

CREATE TRIGGER update_instagram_campaigns_updated_at
    BEFORE UPDATE ON public.instagram_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_instagram_updated_at();

CREATE TRIGGER update_instagram_story_assignments_updated_at
    BEFORE UPDATE ON public.instagram_story_assignments
    FOR EACH ROW EXECUTE FUNCTION update_instagram_updated_at();

-- ============================================================================
-- Function: Auto-set expiry date on assignment
-- ============================================================================
CREATE OR REPLACE FUNCTION set_story_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_date IS NULL THEN
        SELECT 
            NOW() + (duration_hours || ' hours')::INTERVAL
        INTO NEW.expiry_date
        FROM public.instagram_campaigns
        WHERE id = NEW.campaign_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_story_expiry
    BEFORE INSERT ON public.instagram_story_assignments
    FOR EACH ROW EXECUTE FUNCTION set_story_expiry_date();

-- ============================================================================
-- Function: Update user coins on coin log insert
-- ============================================================================
CREATE OR REPLACE FUNCTION update_instagram_user_coins()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.instagram_users
    SET 
        total_coins_earned = total_coins_earned + NEW.coins_amount,
        available_coins = NEW.balance_after
    WHERE id = NEW.instagram_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_coins
    AFTER INSERT ON public.instagram_coin_logs
    FOR EACH ROW EXECUTE FUNCTION update_instagram_user_coins();

-- ============================================================================
-- Function: Create notification on story assignment
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_story_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_campaign_title TEXT;
    v_instagram_username TEXT;
BEGIN
    -- Get campaign title
    SELECT campaign_title INTO v_campaign_title
    FROM public.instagram_campaigns
    WHERE id = NEW.campaign_id;
    
    -- Get Instagram username
    SELECT instagram_username INTO v_instagram_username
    FROM public.instagram_users
    WHERE id = NEW.instagram_user_id;
    
    -- Create notification for Instagram user
    INSERT INTO public.instagram_notifications (
        recipient_type,
        instagram_user_id,
        notification_type,
        title,
        message,
        reference_id,
        reference_type,
        action_url,
        action_label
    ) VALUES (
        'instagram_user',
        NEW.instagram_user_id,
        'story_assigned',
        'New Story Assigned',
        'You have been assigned a new campaign: ' || v_campaign_title,
        NEW.id,
        'story_assignment',
        '/instagram/dashboard',
        'View Story'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_story_assignment
    AFTER INSERT ON public.instagram_story_assignments
    FOR EACH ROW EXECUTE FUNCTION notify_story_assignment();

-- ============================================================================
-- Function: Check and send expiry reminders (to be called by cron job)
-- ============================================================================
CREATE OR REPLACE FUNCTION send_story_expiry_reminders()
RETURNS void AS $$
DECLARE
    v_assignment RECORD;
    v_campaign_title TEXT;
BEGIN
    -- Find stories expiring in 1 hour that haven't been reminded
    FOR v_assignment IN
        SELECT sa.*, iu.instagram_username, iu.name
        FROM public.instagram_story_assignments sa
        JOIN public.instagram_users iu ON sa.instagram_user_id = iu.id
        WHERE sa.status IN ('assigned', 'active')
        AND sa.reminder_sent = false
        AND sa.expiry_date <= NOW() + INTERVAL '1 hour'
        AND sa.expiry_date > NOW()
    LOOP
        -- Get campaign title
        SELECT campaign_title INTO v_campaign_title
        FROM public.instagram_campaigns
        WHERE id = v_assignment.campaign_id;
        
        -- Create notification for admin
        INSERT INTO public.instagram_notifications (
            recipient_type,
            admin_user_id,
            notification_type,
            title,
            message,
            reference_id,
            reference_type,
            action_url,
            action_label
        ) VALUES (
            'admin',
            v_assignment.assigned_by,
            'story_expiring',
            'Story Expiring Soon',
            'Story "' || v_campaign_title || '" assigned to ' || v_assignment.name || ' expires in 1 hour',
            v_assignment.id,
            'story_assignment',
            'https://instagram.com/' || v_assignment.instagram_username,
            'Open Instagram'
        );
        
        -- Mark reminder as sent
        UPDATE public.instagram_story_assignments
        SET reminder_sent = true, reminder_sent_at = NOW()
        WHERE id = v_assignment.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Auto-expire stories (to be called by cron job)
-- ============================================================================
CREATE OR REPLACE FUNCTION expire_old_stories()
RETURNS void AS $$
BEGIN
    UPDATE public.instagram_story_assignments
    SET status = 'expired'
    WHERE status IN ('assigned', 'active')
    AND expiry_date <= NOW()
    AND status != 'completed';
    
    -- Create notifications for expired stories
    INSERT INTO public.instagram_notifications (
        recipient_type,
        instagram_user_id,
        notification_type,
        title,
        message,
        reference_id,
        reference_type
    )
    SELECT 
        'instagram_user',
        sa.instagram_user_id,
        'story_expired',
        'Story Expired',
        'Your assigned story has expired',
        sa.id,
        'story_assignment'
    FROM public.instagram_story_assignments sa
    WHERE sa.status = 'expired'
    AND sa.expiry_date <= NOW()
    AND NOT EXISTS (
        SELECT 1 FROM public.instagram_notifications
        WHERE reference_id = sa.id
        AND notification_type = 'story_expired'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.instagram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_story_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_coin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_notifications ENABLE ROW LEVEL SECURITY;

-- Instagram Users Policies
CREATE POLICY "Admins can manage Instagram users"
    ON public.instagram_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Instagram users can view their own profile"
    ON public.instagram_users FOR SELECT
    USING (email = auth.jwt()->>'email');

-- Campaigns Policies
CREATE POLICY "Admins can manage campaigns"
    ON public.instagram_campaigns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Instagram users can view campaigns assigned to them"
    ON public.instagram_campaigns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.instagram_story_assignments sa
            JOIN public.instagram_users iu ON sa.instagram_user_id = iu.id
            WHERE sa.campaign_id = instagram_campaigns.id
            AND iu.email = auth.jwt()->>'email'
        )
    );

-- Story Assignments Policies
CREATE POLICY "Admins can manage story assignments"
    ON public.instagram_story_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Instagram users can view their assignments"
    ON public.instagram_story_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.instagram_users
            WHERE id = instagram_story_assignments.instagram_user_id
            AND email = auth.jwt()->>'email'
        )
    );

CREATE POLICY "Instagram users can update their assignment status"
    ON public.instagram_story_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.instagram_users
            WHERE id = instagram_story_assignments.instagram_user_id
            AND email = auth.jwt()->>'email'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.instagram_users
            WHERE id = instagram_story_assignments.instagram_user_id
            AND email = auth.jwt()->>'email'
        )
    );

-- Coin Logs Policies
CREATE POLICY "Admins can manage coin logs"
    ON public.instagram_coin_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Instagram users can view their coin logs"
    ON public.instagram_coin_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.instagram_users
            WHERE id = instagram_coin_logs.instagram_user_id
            AND email = auth.jwt()->>'email'
        )
    );

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON public.instagram_notifications FOR SELECT
    USING (
        (recipient_type = 'admin' AND admin_user_id = auth.uid())
        OR
        (recipient_type = 'instagram_user' AND EXISTS (
            SELECT 1 FROM public.instagram_users
            WHERE id = instagram_notifications.instagram_user_id
            AND email = auth.jwt()->>'email'
        ))
    );

CREATE POLICY "Users can update their own notifications"
    ON public.instagram_notifications FOR UPDATE
    USING (
        (recipient_type = 'admin' AND admin_user_id = auth.uid())
        OR
        (recipient_type = 'instagram_user' AND EXISTS (
            SELECT 1 FROM public.instagram_users
            WHERE id = instagram_notifications.instagram_user_id
            AND email = auth.jwt()->>'email'
        ))
    );

-- ============================================================================
-- 8. HELPER FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Get Instagram marketing stats
CREATE OR REPLACE FUNCTION get_instagram_marketing_stats()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    total_campaigns BIGINT,
    active_campaigns BIGINT,
    total_assignments BIGINT,
    active_assignments BIGINT,
    expired_assignments BIGINT,
    completed_assignments BIGINT,
    total_coins_distributed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.instagram_users)::BIGINT,
        (SELECT COUNT(*) FROM public.instagram_users WHERE status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM public.instagram_campaigns)::BIGINT,
        (SELECT COUNT(*) FROM public.instagram_campaigns WHERE status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM public.instagram_story_assignments)::BIGINT,
        (SELECT COUNT(*) FROM public.instagram_story_assignments WHERE status IN ('assigned', 'active'))::BIGINT,
        (SELECT COUNT(*) FROM public.instagram_story_assignments WHERE status = 'expired')::BIGINT,
        (SELECT COUNT(*) FROM public.instagram_story_assignments WHERE status = 'completed')::BIGINT,
        (SELECT COALESCE(SUM(coins_amount), 0) FROM public.instagram_coin_logs WHERE transaction_type IN ('earned', 'bonus'))::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. INITIAL DATA (Optional)
-- ============================================================================

-- You can add sample data here for testing

-- ============================================================================
-- END OF INSTAGRAM MARKETING SCHEMA
-- ============================================================================

