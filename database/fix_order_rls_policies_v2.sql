-- ============================================================================
-- FIX RLS POLICIES FOR ORDER FLOW (Without Returns Table)
-- ============================================================================
-- This script fixes Row Level Security policies to allow:
-- 1. Users to place orders (guest and authenticated)
-- 2. Users to view their own orders
-- 3. Admins to view and manage all orders
-- ============================================================================

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- Policy: Anyone can insert orders (including guests)
CREATE POLICY "Anyone can insert orders"
    ON orders
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        user_id IS NULL -- Allow viewing guest orders
    );

-- Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Admins can update orders
CREATE POLICY "Admins can update orders"
    ON orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Users can update their own orders (for cancellation)
CREATE POLICY "Users can update own orders"
    ON orders
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ORDER_ITEMS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

-- Policy: Anyone can insert order items (including guests)
CREATE POLICY "Anyone can insert order items"
    ON order_items
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can view their own order items
CREATE POLICY "Users can view own order items"
    ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

-- Policy: Admins can view all order items
CREATE POLICY "Admins can view all order items"
    ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Admins can update order items
CREATE POLICY "Admins can update order items"
    ON order_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- SHIPMENTS TABLE POLICIES (if table exists)
-- ============================================================================

-- Check if shipments table exists and create policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shipments') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own shipments" ON shipments;
        DROP POLICY IF EXISTS "Admins can view all shipments" ON shipments;
        DROP POLICY IF EXISTS "Users can insert shipments" ON shipments;
        DROP POLICY IF EXISTS "Admins can insert shipments" ON shipments;
        DROP POLICY IF EXISTS "Admins can update shipments" ON shipments;
        DROP POLICY IF EXISTS "Anyone can insert shipments" ON shipments;

        -- Create new policies
        EXECUTE 'CREATE POLICY "Anyone can insert shipments" ON shipments FOR INSERT WITH CHECK (true)';
        
        EXECUTE 'CREATE POLICY "Users can view own shipments" ON shipments FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM orders
                WHERE orders.id = shipments.order_id
                AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
            )
        )';
        
        EXECUTE 'CREATE POLICY "Admins can view all shipments" ON shipments FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM admin_users
                WHERE admin_users.user_id = auth.uid()
                AND admin_users.is_active = true
            )
        )';
        
        EXECUTE 'CREATE POLICY "Admins can update shipments" ON shipments FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM admin_users
                WHERE admin_users.user_id = auth.uid()
                AND admin_users.is_active = true
            )
        )';
        
        RAISE NOTICE 'Shipments table policies created successfully';
    ELSE
        RAISE NOTICE 'Shipments table does not exist, skipping...';
    END IF;
END $$;

-- ============================================================================
-- AFFILIATE ORDERS TABLE POLICIES (if table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliate_orders') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Affiliates can view own orders" ON affiliate_orders;
        DROP POLICY IF EXISTS "Admins can view all affiliate orders" ON affiliate_orders;
        DROP POLICY IF EXISTS "System can insert affiliate orders" ON affiliate_orders;
        DROP POLICY IF EXISTS "Admins can update affiliate orders" ON affiliate_orders;

        -- Create new policies
        EXECUTE 'CREATE POLICY "System can insert affiliate orders" ON affiliate_orders FOR INSERT WITH CHECK (true)';
        
        EXECUTE 'CREATE POLICY "Affiliates can view own orders" ON affiliate_orders FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM affiliates
                WHERE affiliates.id = affiliate_orders.affiliate_id
                AND affiliates.user_id = auth.uid()
            )
        )';
        
        EXECUTE 'CREATE POLICY "Admins can view all affiliate orders" ON affiliate_orders FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM admin_users
                WHERE admin_users.user_id = auth.uid()
                AND admin_users.is_active = true
            )
        )';
        
        EXECUTE 'CREATE POLICY "Admins can update affiliate orders" ON affiliate_orders FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM admin_users
                WHERE admin_users.user_id = auth.uid()
                AND admin_users.is_active = true
            )
        )';
        
        RAISE NOTICE 'Affiliate orders table policies created successfully';
    ELSE
        RAISE NOTICE 'Affiliate orders table does not exist, skipping...';
    END IF;
END $$;

-- ============================================================================
-- AFFILIATE COMMISSIONS TABLE POLICIES (if table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliate_commissions') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;
        DROP POLICY IF EXISTS "Admins can view all commissions" ON affiliate_commissions;
        DROP POLICY IF EXISTS "System can insert commissions" ON affiliate_commissions;
        DROP POLICY IF EXISTS "Admins can update commissions" ON affiliate_commissions;

        -- Create new policies
        EXECUTE 'CREATE POLICY "System can insert commissions" ON affiliate_commissions FOR INSERT WITH CHECK (true)';
        
        EXECUTE 'CREATE POLICY "Affiliates can view own commissions" ON affiliate_commissions FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM affiliates
                WHERE affiliates.id = affiliate_commissions.affiliate_id
                AND affiliates.user_id = auth.uid()
            )
        )';
        
        EXECUTE 'CREATE POLICY "Admins can view all commissions" ON affiliate_commissions FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM admin_users
                WHERE admin_users.user_id = auth.uid()
                AND admin_users.is_active = true
            )
        )';
        
        EXECUTE 'CREATE POLICY "Admins can update commissions" ON affiliate_commissions FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM admin_users
                WHERE admin_users.user_id = auth.uid()
                AND admin_users.is_active = true
            )
        )';
        
        RAISE NOTICE 'Affiliate commissions table policies created successfully';
    ELSE
        RAISE NOTICE 'Affiliate commissions table does not exist, skipping...';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'shipments', 'affiliate_orders', 'affiliate_commissions')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICIES UPDATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Orders table: ✓ Fixed';
    RAISE NOTICE 'Order items table: ✓ Fixed';
    RAISE NOTICE 'Other tables: ✓ Checked and fixed if exist';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now place orders!';
    RAISE NOTICE '========================================';
END $$;
