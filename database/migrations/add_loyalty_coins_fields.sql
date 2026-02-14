-- Add loyalty_coins_reward and loyalty_coins_price columns to products table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'loyalty_coins_reward') THEN 
        ALTER TABLE products ADD COLUMN loyalty_coins_reward INTEGER DEFAULT 0; 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'loyalty_coins_price') THEN 
        ALTER TABLE products ADD COLUMN loyalty_coins_price INTEGER DEFAULT NULL; 
    END IF; 
END $$;
