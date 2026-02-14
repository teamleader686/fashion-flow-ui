-- Add available_sizes and available_colors columns to products table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'available_sizes') THEN 
        ALTER TABLE products ADD COLUMN available_sizes TEXT[] DEFAULT '{}'; 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'available_colors') THEN 
        ALTER TABLE products ADD COLUMN available_colors JSONB DEFAULT '[]'; 
    END IF; 
END $$;
