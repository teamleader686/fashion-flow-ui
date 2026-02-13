-- ============================================================================
-- USER ADDRESS MANAGEMENT SYSTEM
-- ============================================================================
-- This script creates the addresses table and sets up RLS policies.
-- ============================================================================

-- Step 1: Create addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pincode TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    address_line TEXT NOT NULL,
    landmark TEXT,
    address_type TEXT NOT NULL DEFAULT 'Home', -- Home, Work, Other
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Enable RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
-- Allow users to view their own addresses
CREATE POLICY "Users can view their own addresses"
    ON public.user_addresses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own addresses
CREATE POLICY "Users can insert their own addresses"
    ON public.user_addresses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own addresses
CREATE POLICY "Users can update their own addresses"
    ON public.user_addresses
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own addresses
CREATE POLICY "Users can delete their own addresses"
    ON public.user_addresses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 4: Create a function to handle default address logic
-- When an address is set as default, unset other default addresses for the same user
CREATE OR REPLACE FUNCTION handle_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.user_addresses
        SET is_default = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger for default address
DROP TRIGGER IF EXISTS on_address_default_changed ON public.user_addresses;
CREATE TRIGGER on_address_default_changed
    BEFORE INSERT OR UPDATE OF is_default ON public.user_addresses
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION handle_default_address();

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER set_addresses_updated_at
    BEFORE UPDATE ON public.user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ User address management system initialized!';
END $$;
