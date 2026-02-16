import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Hook to track affiliate referrals from URL parameters.
 * 
 * Captures ?ref=CODE from any page and stores in localStorage.
 * If on a product page (/product/:slug), resolves the slug to a product UUID
 * for accurate product-specific commission tracking.
 * 
 * Policies:
 *   - "First Referral Wins": Does not overwrite an existing valid referral
 *   - 7-day expiry: Referral auto-clears after 7 days
 */
export function useAffiliateTracker() {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        const EXPIRY_DAYS = 7;
        const now = new Date();

        // --- Step 1: Check & clean existing stored referral ---
        const storedRef = localStorage.getItem('affiliate_referral_code');
        const storedTime = localStorage.getItem('affiliate_referral_time');

        let existingIsValid = false;
        if (storedRef && storedTime) {
            const diffDays = (now.getTime() - new Date(storedTime).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < EXPIRY_DAYS) {
                existingIsValid = true;
            } else {
                // Expired — clear all referral data
                clearReferralData();
            }
        }

        // --- Step 2: Store new referral (only if no valid existing one) ---
        if (ref && !existingIsValid) {
            localStorage.setItem('affiliate_referral_code', ref);
            localStorage.setItem('affiliate_referral_time', now.toISOString());

            // Extract product slug from URL (route is /product/:slug)
            const path = window.location.pathname;
            const slugMatch = path.match(/\/product\/([^/?#]+)/);
            const productSlug = slugMatch ? slugMatch[1] : null;

            if (productSlug) {
                // Resolve slug → UUID for accurate matching at order time
                resolveAndStoreProductId(productSlug);
            }

            // Log the click asynchronously
            logAffiliateClick(ref, productSlug);
        }
    }, [searchParams]);
}

/**
 * Clear all referral-related localStorage keys
 */
function clearReferralData() {
    localStorage.removeItem('affiliate_referral_code');
    localStorage.removeItem('affiliate_referral_time');
    localStorage.removeItem('affiliate_ref_product_id');
}

/**
 * Resolve a product slug to its UUID and store it.
 * This is critical because the cart/order uses product UUIDs,
 * but the URL uses slugs.
 */
async function resolveAndStoreProductId(slug: string) {
    try {
        const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (product) {
            localStorage.setItem('affiliate_ref_product_id', product.id);
            console.log('[Affiliate] Product resolved:', slug, '→', product.id);
        } else {
            console.warn('[Affiliate] Product slug not found:', slug);
        }
    } catch (err) {
        console.error('[Affiliate] Error resolving product slug:', err);
    }
}

/**
 * Log the referral click to the affiliate_clicks table
 */
async function logAffiliateClick(referralCode: string, productSlug: string | null) {
    try {
        // 1. Get Affiliate ID
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('referral_code', referralCode)
            .eq('status', 'active')
            .maybeSingle();

        if (!affiliate) {
            console.warn('[Affiliate] Invalid or inactive referral code:', referralCode);
            return;
        }

        // 2. Resolve product ID if we have a slug
        let productId: string | null = null;
        if (productSlug) {
            const { data: product } = await supabase
                .from('products')
                .select('id')
                .eq('slug', productSlug)
                .maybeSingle();
            productId = product?.id || null;
        }

        // 3. Insert click record
        const { error: clickError } = await supabase.from('affiliate_clicks').insert({
            affiliate_id: affiliate.id,
            landing_page: window.location.href,
            product_id: productId,
            user_agent: navigator.userAgent,
            referrer: document.referrer,
        });

        if (clickError) {
            console.warn('[Affiliate] Click log failed (table may not exist):', clickError.message);
        }

        console.log('[Affiliate] Click logged for:', referralCode);
    } catch (err) {
        console.error('[Affiliate] Error logging click:', err);
    }
}
