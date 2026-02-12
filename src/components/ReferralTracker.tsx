import { useEffect } from 'react';
import { useAffiliateMarketing } from '@/hooks/useAffiliateMarketing';

// This component tracks referral clicks from URL parameters
export default function ReferralTracker() {
  const { trackClick } = useAffiliateMarketing();

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');

    if (referralCode) {
      // Track the click
      trackClick(referralCode);
      
      // Clean up URL (remove ref parameter)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  return null; // This component doesn't render anything
}
