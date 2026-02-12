-- ============================================================================
-- PRODUCT MANAGEMENT EXTENSIONS
-- Additional tables for loyalty, affiliate, and offer management
-- ============================================================================

-- ============================================================================
-- PRODUCT LOYALTY CONFIGURATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_loyalty_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    
    -- Loyalty Settings
    is_enabled BOOLEAN DEFAULT true,
    coins_earned_per_purchase INTEGER DEFAULT 10 CHECK (coins_earned_per_purchase >= 0),
    coins_required_for_redemption INTEGER DEFAULT 100 CHECK (coins_required_for_redemption >= 0),
    max_coins_usable_per_order INTEGER DEFAULT 500 CHECK (max_coins_usable_per_order >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_product_loyalty_config_product_id ON public.product_loyalty_config(product_id);

-- ============================================================================
-- PRODUCT AFFILIATE CONFIGURATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_affiliate_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    
    -- Affiliate Settings
    is_enabled BOOLEAN DEFAULT false,
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value DECIMAL(10,2) NOT NULL CHECK (commission_value >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_product_affiliate_config_product_id ON public.product_affiliate_config(product_id);

-- ============================================================================
-- PRODUCT OFFERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- Offer Details
    offer_type VARCHAR(30) NOT NULL CHECK (offer_type IN ('percentage_discount', 'flat_discount', 'bogo')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
    
    -- Validity
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Display
    banner_tag VARCHAR(100), -- "Limited Offer", "Hot Deal", "50% OFF"
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end_date is after start_date
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes for faster lookups
CREATE INDEX idx_product_offers_product_id ON public.product_offers(product_id);
CREATE INDEX idx_product_offers_dates ON public.product_offers(start_date, end_date);
CREATE INDEX idx_product_offers_active ON public.product_offers(is_active);

-- ============================================================================
-- AFFILIATE COUPONS (Extended from existing coupons table)
-- ============================================================================
-- Add affiliate-specific columns to existing coupons table if not exists
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliate_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_affiliate_coupon BOOLEAN DEFAULT false;

-- Index for affiliate coupons
CREATE INDEX IF NOT EXISTS idx_coupons_affiliate_id ON public.coupons(affiliate_id);

-- ============================================================================
-- AFFILIATE COMMISSIONS TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    -- Commission Details
    commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
    commission_rate DECIMAL(10,2) NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_order_id ON public.affiliate_commissions(order_id);
CREATE INDEX idx_affiliate_commissions_status ON public.affiliate_commissions(status);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Product Loyalty Config
CREATE TRIGGER update_product_loyalty_config_updated_at
    BEFORE UPDATE ON public.product_loyalty_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Product Affiliate Config
CREATE TRIGGER update_product_affiliate_config_updated_at
    BEFORE UPDATE ON public.product_affiliate_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Product Offers
CREATE TRIGGER update_product_offers_updated_at
    BEFORE UPDATE ON public.product_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Get Active Offer for Product
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_product_offer(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    offer_type VARCHAR,
    discount_value DECIMAL,
    banner_tag VARCHAR,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        po.id,
        po.offer_type,
        po.discount_value,
        po.banner_tag,
        po.start_date,
        po.end_date
    FROM public.product_offers po
    WHERE po.product_id = p_product_id
    AND po.is_active = true
    AND NOW() BETWEEN po.start_date AND po.end_date
    ORDER BY po.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Calculate Product Final Price with Offer
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_product_price_with_offer(
    p_product_id UUID,
    p_base_price DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_offer RECORD;
    v_final_price DECIMAL;
BEGIN
    -- Get active offer
    SELECT * INTO v_offer
    FROM get_active_product_offer(p_product_id);
    
    -- If no active offer, return base price
    IF v_offer IS NULL THEN
        RETURN p_base_price;
    END IF;
    
    -- Calculate discounted price based on offer type
    CASE v_offer.offer_type
        WHEN 'percentage_discount' THEN
            v_final_price := p_base_price * (1 - v_offer.discount_value / 100);
        WHEN 'flat_discount' THEN
            v_final_price := p_base_price - v_offer.discount_value;
        ELSE
            v_final_price := p_base_price;
    END CASE;
    
    -- Ensure price doesn't go below 0
    IF v_final_price < 0 THEN
        v_final_price := 0;
    END IF;
    
    RETURN v_final_price;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Calculate Affiliate Commission
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_affiliate_commission(
    p_product_id UUID,
    p_order_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_config RECORD;
    v_commission DECIMAL;
BEGIN
    -- Get affiliate config for product
    SELECT * INTO v_config
    FROM public.product_affiliate_config
    WHERE product_id = p_product_id
    AND is_enabled = true;
    
    -- If no config or not enabled, return 0
    IF v_config IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate commission
    CASE v_config.commission_type
        WHEN 'percentage' THEN
            v_commission := p_order_amount * (v_config.commission_value / 100);
        WHEN 'fixed' THEN
            v_commission := v_config.commission_value;
        ELSE
            v_commission := 0;
    END CASE;
    
    RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Process Loyalty Coins on Order
-- ============================================================================
CREATE OR REPLACE FUNCTION process_product_loyalty_coins(
    p_user_id UUID,
    p_product_id UUID,
    p_order_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_config RECORD;
    v_coins_earned INTEGER;
BEGIN
    -- Get loyalty config for product
    SELECT * INTO v_config
    FROM public.product_loyalty_config
    WHERE product_id = p_product_id
    AND is_enabled = true;
    
    -- If no config or not enabled, return 0
    IF v_config IS NULL THEN
        RETURN 0;
    END IF;
    
    v_coins_earned := v_config.coins_earned_per_purchase;
    
    -- Credit coins to user
    INSERT INTO public.loyalty_transactions (
        user_id,
        transaction_type,
        coins,
        balance_after,
        source,
        order_id,
        description
    ) VALUES (
        p_user_id,
        'earned',
        v_coins_earned,
        (SELECT available_coins FROM public.loyalty_coins WHERE user_id = p_user_id) + v_coins_earned,
        'product_purchase',
        p_order_id,
        'Coins earned from product purchase'
    );
    
    -- Update loyalty coins balance
    UPDATE public.loyalty_coins
    SET available_coins = available_coins + v_coins_earned,
        total_earned = total_earned + v_coins_earned
    WHERE user_id = p_user_id;
    
    RETURN v_coins_earned;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.product_loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_affiliate_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Product Loyalty Config - Admins can manage, users can view
CREATE POLICY "Admins can manage product loyalty config"
    ON public.product_loyalty_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Anyone can view product loyalty config"
    ON public.product_loyalty_config FOR SELECT
    USING (true);

-- Product Affiliate Config - Admins only
CREATE POLICY "Admins can manage product affiliate config"
    ON public.product_affiliate_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Product Offers - Admins can manage, users can view active offers
CREATE POLICY "Admins can manage product offers"
    ON public.product_offers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Anyone can view active product offers"
    ON public.product_offers FOR SELECT
    USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

-- Affiliate Commissions - Admins and respective affiliates can view
CREATE POLICY "Admins can manage affiliate commissions"
    ON public.affiliate_commissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Affiliates can view their own commissions"
    ON public.affiliate_commissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.affiliate_users
            WHERE id = affiliate_commissions.affiliate_id
            AND user_id = auth.uid()
        )
    );

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for product-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_loyalty_config;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample loyalty config
-- INSERT INTO public.product_loyalty_config (product_id, is_enabled, coins_earned_per_purchase, coins_required_for_redemption, max_coins_usable_per_order)
-- SELECT id, true, 10, 100, 500 FROM public.products LIMIT 5;

-- ============================================================================
-- END OF EXTENSIONS
-- ============================================================================
