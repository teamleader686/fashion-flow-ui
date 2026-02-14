-- Add total_coins_to_earn column to orders table
ALTER TABLE orders 
ADD COLUMN total_coins_to_earn INTEGER DEFAULT 0;

-- Comment: This column stores the pending loyalty coins that will be awarded upon delivery.
