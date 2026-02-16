import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileCompletionDialog from './ProfileCompletionDialog';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface ProfileCompletionGuardProps {
    children: React.ReactNode;
}

export default function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
    const { user, profile, loading } = useAuth();
    const [showDialog, setShowDialog] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // 0. Wait for Auth to load
        if (loading) return;

        // 1. No User -> No Dialog
        if (!user) {
            setShowDialog(false);
            return;
        }

        // 2. EXCLUDE NON-CUSTOMER ROLES
        // We strictly only want 'customer' or 'user' roles to see this.
        // Admins, Affiliates, Instagram Users should NEVER see this.
        const userRole = profile?.role;
        // Cast to string to avoid TS errors if the type definition is too narrow
        if (userRole === 'admin' || (userRole as string) === 'affiliate' || (userRole as string) === 'instagram_user') {
            setShowDialog(false);
            return;
        }

        // 3. EXCLUDE ADMIN/AFFILIATE PATHS
        // Even if role is somehow wrong, never show on these paths
        const currentPath = location.pathname;
        if (
            currentPath.startsWith('/admin') ||
            currentPath.startsWith('/affiliate') ||
            currentPath.startsWith('/instagram')
        ) {
            setShowDialog(false);
            return;
        }

        // 4. CHECK IF ALREADY SHOWN IN SESSION
        // We use a session key to ensure we don't nag them on every reload if they dismissed it.
        const hasSeenDialog = sessionStorage.getItem(`profile_checked_${user.id}`);
        if (hasSeenDialog === 'true') {
            setShowDialog(false);
            return;
        }

        // 5. CHECK PROFILE COMPLETENESS (Only for Customers)
        // If profile is NOT complete, show the dialog.
        const isComplete = profile?.profile_completed === true;

        if (!isComplete) {
            setShowDialog(true);
            // Mark as seen so we don't flash it again instantly if logic re-runs 
            sessionStorage.setItem(`profile_checked_${user.id}`, 'true');
        } else {
            setShowDialog(false);
        }

    }, [user, profile, loading, location.pathname]);

    const handleComplete = () => {
        // Force refresh to update all contexts with new profile data
        localStorage.setItem(`profile_checked_${user?.id}`, 'true');
        window.location.reload();
    };

    const handleDialogChange = (open: boolean) => {
        // Only allow closing if profile is complete
        // BUT also check if it shouldn't have been open in the first place (role check)
        const userRole = profile?.role || 'customer';
        if (userRole === 'admin' || (userRole as string) === 'affiliate') {
            setShowDialog(false);
            return;
        }

        if (!open && (!profile || !profile.profile_completed)) {
            // If they close it without completing, we mark it as checked for this session
            // to follow the "don't repeat every click" requirement
            toast.info("Please complete your profile later to unlock all features");
            localStorage.setItem(`profile_checked_${user?.id}`, 'true');
            setShowDialog(false);
            return;
        }
        setShowDialog(open);
    };

    return (
        <>
            {children}
            {showDialog && (
                <ProfileCompletionDialog
                    open={showDialog}
                    onOpenChange={handleDialogChange}
                    onComplete={handleComplete}
                />
            )}
        </>
    );
}
