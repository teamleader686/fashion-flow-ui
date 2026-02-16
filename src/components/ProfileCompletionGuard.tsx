import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileCompletionDialog from './ProfileCompletionDialog';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ProfileCompletionGuardProps {
    children: React.ReactNode;
}

export default function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
    const { user, profile, loading } = useAuth();
    const [showDialog, setShowDialog] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const location = useLocation();

    // Step 5: Separate check function
    const checkProfileStatus = async () => {
        if (!user) return;

        try {
            // fast check: local storage (Step 3)
            const localComplete = localStorage.getItem("profile_complete");
            if (localComplete === "true") {
                setShowDialog(false);
                return;
            }

            // DB check (Step 5)
            const { data, error } = await supabase
                .from("users")
                .select("is_profile_complete, profile_completed") // Check both just in case
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Error checking profile status:", error);
                return;
            }

            // If incomplete in DB, show dialog
            // We check both the new column and the old one for backward compatibility
            const isComplete = data?.is_profile_complete || data?.profile_completed;

            if (!isComplete) {
                setShowDialog(true);
            } else {
                // If complete in DB but not in local storage, sync it
                localStorage.setItem("profile_complete", "true");
                setShowDialog(false);
            }
        } catch (err) {
            console.error("Unexpected error in profile check:", err);
        }
    };

    useEffect(() => {
        // 0. Wait for Auth to load
        if (loading) return;

        // 1. No User -> No Dialog
        // Step 10: Reset on logout
        if (!user) {
            setShowDialog(false);
            localStorage.removeItem("profile_complete"); // Clear on logout so new login checks fresh
            return;
        }

        // 2. Step 7: ROLE BASED CHECK - Admin & Affiliate ke liye dialog show na ho
        const userRole = profile?.role || 'customer';
        const roleStr = userRole as string;

        if (roleStr === 'admin' || roleStr === 'affiliate' || roleStr === 'instagram_user') {
            setShowDialog(false);
            return;
        }

        // 3. EXCLUDE ADMIN/AFFILIATE PATHS
        const currentPath = location.pathname;
        if (
            currentPath.startsWith('/admin') ||
            currentPath.startsWith('/affiliate') ||
            currentPath.startsWith('/instagram')
        ) {
            setShowDialog(false);
            return;
        }

        // 4. Step 6: PREVENT MULTIPLE OPEN
        // Only run the detailed check once per mount/user-session
        if (!hasChecked) {
            checkProfileStatus();
            setHasChecked(true);
        }

    }, [user, profile, loading, location.pathname, hasChecked]);

    const handleComplete = () => {
        // Step 3 & 9: Update local storage and close
        localStorage.setItem("profile_complete", "true");
        setShowDialog(false);

        // Optional: reload if needed to refresh heavy context, but usually not needed if state is handled right
        // window.location.reload(); 
    };

    const handleDialogChange = (open: boolean) => {
        // Prevent closing if not complete (unless there's a specific "skip" logic which isn't requested)
        // For now, we allow closing but it might pop up again on refresh if not complete.
        // User said: "Dialog sirf tab show ho jab profile incomplete ho"

        if (!open) {
            // If user tries to close, we can check if they really should be allowed to.
            // User request implies it forces them to complete. 
            // But for UX, usually we let them close or provided a "remind me later".
            // Current implementation in previous file allowed closing.

            // If we want to be strict: don't allow closing if still incomplete.
            // But let's follow the standard pattern:
            setShowDialog(false);
        } else {
            setShowDialog(true);
        }
    };

    return (
        <>
            {children}
            <ProfileCompletionDialog
                open={showDialog}
                onOpenChange={handleDialogChange}
                onComplete={handleComplete}
            />
        </>
    );
}
