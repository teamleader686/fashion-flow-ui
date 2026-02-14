-- ============================================
-- ADVANCED AFFILIATE REFERRAL TRACKING SYSTEM
-- ============================================

-- 1. Update user_profiles to store persistent referral
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS referred_by_affiliate UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- 2. Ensure orders table has necessary affiliate columns
-- affiliate_id might already exist, but we ensure it's there
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliate_commission_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS affiliate_commission_status VARCHAR(20) DEFAULT 'pending' CHECK (affiliate_commission_status IN ('pending', 'approved', 'paid', 'cancelled'));

-- 3. Trigger to auto-link affiliate to order if user has a referral
CREATE OR REPLACE FUNCTION public.link_affiliate_to_order()
RETURNS TRIGGER AS $$
DECLARE
    v_affiliate_id UUID;
BEGIN
    -- If affiliate_id is already provided, keep it
    IF NEW.affiliate_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Look up if the user has a persistent referral
    IF NEW.user_id IS NOT NULL THEN
        SELECT referred_by_affiliate INTO v_affiliate_id
        FROM public.user_profiles
        WHERE user_id = NEW.user_id;

        IF v_affiliate_id IS NOT NULL THEN
            NEW.affiliate_id := v_affiliate_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_link_affiliate_to_order ON public.orders;
CREATE TRIGGER trigger_link_affiliate_to_order
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.link_affiliate_to_order();

-- 4. Function to process commission when order is delivered
CREATE OR REPLACE FUNCTION public.process_order_delivery_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to delivered and there's an affiliate
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.affiliate_id IS NOT NULL THEN
        -- Mark commission as approved
        UPDATE public.orders 
        SET affiliate_commission_status = 'approved'
        WHERE id = NEW.id;

        -- We could also auto-pay here, but usually it's better to let admin review OR 
        -- have a separate process for approval.
        -- For now, we'll mark it as approved in the affiliate_commissions/affiliate_orders tables too.
        
        UPDATE public.affiliate_commissions
        SET status = 'approved', approved_at = NOW()
        WHERE order_id = NEW.id;
        
        UPDATE public.affiliate_orders
        SET commission_status = 'approved'
        WHERE order_id = NEW.id;
    END IF;

    -- If status changed to cancelled, mark commission as cancelled
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.affiliate_id IS NOT NULL THEN
        UPDATE public.orders 
        SET affiliate_commission_status = 'cancelled'
        WHERE id = NEW.id;

        UPDATE public.affiliate_commissions
        SET status = 'cancelled'
        WHERE order_id = NEW.id;
        
        UPDATE public.affiliate_orders
        SET commission_status = 'cancelled'
        WHERE order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_commission_on_delivery ON public.orders;
CREATE TRIGGER trigger_process_commission_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.process_order_delivery_commission();
