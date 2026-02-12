-- ============================================
-- STEP 3: Create Functions and Triggers
-- ============================================
-- Run this AFTER STEP_2_CREATE_AFFILIATE_TABLES.sql
-- This creates all the automation functions and triggers
-- ============================================

-- Function: Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Update affiliate statistics
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE affiliates
    SET 
      total_orders = total_orders + 1,
      total_sales = total_sales + NEW.order_total,
      total_commission = total_commission + NEW.commission_amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  SELECT wallet_balance INTO current_balance
  FROM affiliates
  WHERE id = NEW.affiliate_id;

  NEW.balance_before := current_balance;

  IF NEW.transaction_type = 'credit' THEN
    NEW.balance_after := current_balance + NEW.amount;
  ELSE
    NEW.balance_after := current_balance - NEW.amount;
  END IF;

  UPDATE affiliates
  SET wallet_balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.affiliate_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-generate referral code
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate commission
CREATE OR REPLACE FUNCTION calculate_affiliate_commission(
  p_affiliate_id UUID,
  p_order_total DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_commission_type TEXT;
  v_commission_value DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  SELECT commission_type, commission_value
  INTO v_commission_type, v_commission_value
  FROM affiliates
  WHERE id = p_affiliate_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_commission_type = 'percentage' THEN
    v_commission_amount := (p_order_total * v_commission_value) / 100;
  ELSE
    v_commission_amount := v_commission_value;
  END IF;

  RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Function: Process commission payment
CREATE OR REPLACE FUNCTION process_commission_payment(
  p_affiliate_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affiliate_id UUID;
  v_commission_amount DECIMAL;
  v_order_id UUID;
BEGIN
  SELECT affiliate_id, commission_amount, order_id
  INTO v_affiliate_id, v_commission_amount, v_order_id
  FROM affiliate_orders
  WHERE id = p_affiliate_order_id
  AND commission_status = 'approved';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO wallet_transactions (
    affiliate_id,
    transaction_type,
    amount,
    reference_type,
    reference_id,
    description
  ) VALUES (
    v_affiliate_id,
    'credit',
    v_commission_amount,
    'commission',
    p_affiliate_order_id,
    'Commission for order #' || v_order_id
  );

  UPDATE affiliate_orders
  SET commission_status = 'paid'
  WHERE id = p_affiliate_order_id;

  UPDATE affiliate_commissions
  SET status = 'paid', paid_at = NOW()
  WHERE affiliate_order_id = p_affiliate_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON affiliate_orders;
CREATE TRIGGER trigger_update_affiliate_stats
AFTER INSERT ON affiliate_orders
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_stats();

DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet_balance
BEFORE INSERT ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance();

DROP TRIGGER IF EXISTS trigger_set_referral_code ON affiliates;
CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON affiliates
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

DROP TRIGGER IF EXISTS trigger_affiliates_updated_at ON affiliates;
CREATE TRIGGER trigger_affiliates_updated_at
BEFORE UPDATE ON affiliates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ All functions and triggers created successfully!';
  RAISE NOTICE '📝 Next: Run STEP_4_ENABLE_RLS_POLICIES.sql';
END $$;
