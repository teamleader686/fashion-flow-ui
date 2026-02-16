import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Hook to track Instagram campaigns from URL parameters.
 * 
 * Captures ?campaign=CODE from any page and stores in localStorage.
 * 
 * Policies:
 *   - "Priority System": Affiliate Coupon > Referral Link > Instagram Campaign
 *   - 3-day expiry: Referral auto-clears after 3 days
 */
export function useInstagramTracker() {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const campaignCode = searchParams.get('campaign');
        const EXPIRY_DAYS = 3;
        const now = new Date();

        // --- Step 1: Check & clean existing stored campaign ---
        const storedCode = localStorage.getItem('campaign_code');
        const storedTime = localStorage.getItem('campaign_time');

        let existingIsValid = false;
        if (storedCode && storedTime) {
            const diffDays = (now.getTime() - new Date(storedTime).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < EXPIRY_DAYS) {
                existingIsValid = true;
            } else {
                localStorage.removeItem('campaign_code');
                localStorage.removeItem('campaign_time');
            }
        }

        // --- Step 2: Store new campaign (only if no valid existing one or new one provided) ---
        // Note: We overwrite if a new one is explicitly provided in the URL to allow users to switch campaigns
        if (campaignCode && campaignCode !== storedCode) {
            localStorage.setItem('campaign_code', campaignCode);
            localStorage.setItem('campaign_time', now.toISOString());

            // Log the click asynchronously
            logCampaignClick(campaignCode);
        }
    }, [searchParams]);
}

/**
 * Log the campaign click to the campaign_clicks table
 */
async function logCampaignClick(campaignCode: string) {
    try {
        // 1. Get Campaign ID
        const { data: campaign } = await supabase
            .from('instagram_campaigns')
            .select('id')
            .eq('campaign_code', campaignCode)
            .eq('is_active', true)
            .maybeSingle();

        if (!campaign) {
            console.warn('[Instagram] Invalid or inactive campaign code:', campaignCode);
            return;
        }

        // 2. Identify user if logged in
        const { data: { user } } = await supabase.auth.getUser();

        // 3. Extract product ID if on a product page
        let productId: string | null = null;
        const path = window.location.pathname;
        const slugMatch = path.match(/\/product\/([^/?#]+)/);
        const productSlug = slugMatch ? slugMatch[1] : null;

        if (productSlug) {
            const { data: product } = await supabase
                .from('products')
                .select('id')
                .eq('slug', productSlug)
                .maybeSingle();
            productId = product?.id || null;
        }

        // 4. Insert click record
        const { error: clickError } = await supabase.from('campaign_clicks').insert({
            campaign_id: campaign.id,
            user_id: user?.id || null,
            product_id: productId,
            referrer_url: document.referrer,
            user_agent: navigator.userAgent,
        });

        if (clickError) {
            console.warn('[Instagram] Click log failed:', clickError.message);
        } else {
            console.log('[Instagram] Campaign click logged:', campaignCode);
        }
    } catch (err) {
        console.error('[Instagram] Error logging click:', err);
    }
}
