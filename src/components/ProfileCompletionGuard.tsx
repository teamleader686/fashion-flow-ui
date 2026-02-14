import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileCompletionDialog from './ProfileCompletionDialog';

interface ProfileCompletionGuardProps {
    children: React.ReactNode;
}

export default function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
    const { user, profile, loading } = useAuth();
    const [showDialog, setShowDialog] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Don't check until auth is loaded
        if (loading) return;

        // Only check once per session
        if (hasChecked) return;

        // Only check for logged-in users
        if (!user || !profile) {
            setHasChecked(true);
            return;
        }

        // Don't show for admin users
        if (profile.role === 'admin') {
            setHasChecked(true);
            return;
        }

        // Check if profile is incomplete
        const isIncomplete = !profile.profile_completed ||
            !profile.phone ||
            !profile.full_name;

        if (isIncomplete) {
            // Small delay to let the page load first
            const timer = setTimeout(() => {
                setShowDialog(true);
                setHasChecked(true);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            setHasChecked(true);
        }
    }, [user, profile, loading, hasChecked]);

    const handleComplete = () => {
        // Refresh the page to update the profile data
        window.location.reload();
    };

    const handleDialogChange = (open: boolean) => {
        setShowDialog(open);
        if (!open) {
            setHasChecked(true);
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
