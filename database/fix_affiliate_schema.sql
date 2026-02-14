-- FIX: Add missing columns to affiliate tables to match application logic
ALTER TABLE public.affiliate_orders 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS order_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commission_status VARCHAR(20) DEFAULT 'pending';

-- Map order_amount to order_total if it exists but is named differently
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affiliate_orders' AND column_name = 'order_amount'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.affiliate_orders WHERE order_total IS NOT NULL LIMIT 1
    ) THEN
        UPDATE public.affiliate_orders SET order_total = order_amount;
    END IF;
END $$;
