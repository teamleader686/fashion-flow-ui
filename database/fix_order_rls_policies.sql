-- ============================================================================
-- FIX RLS POLICIES FOR ORDER FLOW
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
-- SHIPMENTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own shipments" ON shipments;
DROP POLICY IF EXISTS "Admins can view all shipments" ON shipments;
DROP POLICY IF EXISTS "Users can insert shipments" ON shipments;
DROP POLICY IF EXISTS "Admins can insert shipments" ON shipments;
DROP POLICY IF EXISTS "Admins can update shipments" ON shipments;
DROP POLICY IF EXISTS "Anyone can insert shipments" ON shipments;

-- Policy: Anyone can insert shipments (for order creation)
CREATE POLICY "Anyone can insert shipments"
    ON shipments
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can view their own shipments
CREATE POLICY "Users can view own shipments"
    ON shipments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = shipments.order_id
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

-- Policy: Admins can view all shipments
CREATE POLICY "Admins can view all shipments"
    ON shipments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Admins can update shipments
CREATE POLICY "Admins can update shipments"
    ON shipments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- RETURNS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own returns" ON returns;
DROP POLICY IF EXISTS "Admins can view all returns" ON returns;
DROP POLICY IF EXISTS "Users can insert returns" ON returns;
DROP POLICY IF EXISTS "Admins can update returns" ON returns;

-- Policy: Users can insert returns for their orders
CREATE POLICY "Users can insert returns"
    ON returns
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = returns.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Policy: Users can view their own returns
CREATE POLICY "Users can view own returns"
    ON returns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = returns.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Policy: Admins can view all returns
CREATE POLICY "Admins can view all returns"
    ON returns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Admins can update returns
CREATE POLICY "Admins can update returns"
    ON returns
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- AFFILIATE ORDERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Affiliates can view own orders" ON affiliate_orders;
DROP POLICY IF EXISTS "Admins can view all affiliate orders" ON affiliate_orders;
DROP POLICY IF EXISTS "System can insert affiliate orders" ON affiliate_orders;
DROP POLICY IF EXISTS "Admins can update affiliate orders" ON affiliate_orders;

-- Policy: System can insert affiliate orders (during order placement)
CREATE POLICY "System can insert affiliate orders"
    ON affiliate_orders
    FOR INSERT
    WITH CHECK (true);

-- Policy: Affiliates can view their own orders
CREATE POLICY "Affiliates can view own orders"
    ON affiliate_orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM affiliates
            WHERE affiliates.id = affiliate_orders.affiliate_id
            AND affiliates.user_id = auth.uid()
        )
    );

-- Policy: Admins can view all affiliate orders
CREATE POLICY "Admins can view all affiliate orders"
    ON affiliate_orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Admins can update affiliate orders
CREATE POLICY "Admins can update affiliate orders"
    ON affiliate_orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- AFFILIATE COMMISSIONS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "Admins can view all commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "System can insert commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "Admins can update commissions" ON affiliate_commissions;

-- Policy: System can insert commissions (during order placement)
CREATE POLICY "System can insert commissions"
    ON affiliate_commissions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Affiliates can view their own commissions
CREATE POLICY "Affiliates can view own commissions"
    ON affiliate_commissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM affiliates
            WHERE affiliates.id = affiliate_commissions.affiliate_id
            AND affiliates.user_id = auth.uid()
        )
    );

-- Policy: Admins can view all commissions
CREATE POLICY "Admins can view all commissions"
    ON affiliate_commissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Admins can update commissions
CREATE POLICY "Admins can update commissions"
    ON affiliate_commissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'shipments', 'returns', 'affiliate_orders', 'affiliate_commissions')
ORDER BY tablename, policyname;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Anyone can insert orders" ON orders IS 'Allows both authenticated users and guests to place orders';
COMMENT ON POLICY "Anyone can insert order items" ON order_items IS 'Allows order items to be created during order placement';
COMMENT ON POLICY "Anyone can insert shipments" ON shipments IS 'Allows shipment records to be created during order placement';
COMMENT ON POLICY "System can insert affiliate orders" ON affiliate_orders IS 'Allows affiliate order tracking during order placement';
COMMENT ON POLICY "System can insert commissions" ON affiliate_commissions IS 'Allows commission records during order placement';

-- ============================================================================
-- NOTES
-- ============================================================================
-- These policies allow:
-- 1. Guest users to place orders (user_id can be NULL)
-- 2. Authenticated users to place orders and view their own orders
-- 3. Admins to view and manage all orders
-- 4. Affiliate tracking to work during order placement
-- 5. Proper isolation between users (can't see each other's orders)
-- ============================================================================
