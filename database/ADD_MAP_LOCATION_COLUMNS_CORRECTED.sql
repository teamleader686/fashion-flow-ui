-- Add map location columns to user_addresses (Corrected Table Name)
ALTER TABLE public.user_addresses
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS map_address text;

-- Add map location columns to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS map_address text;
