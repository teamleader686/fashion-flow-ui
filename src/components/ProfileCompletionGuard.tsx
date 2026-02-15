import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileCompletionDialog from './ProfileCompletionDialog';
import { toast } from 'sonner';

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

        // Skip check if no user is logged in
        if (!user) {
            setHasChecked(true);
            return;
        }

        // Check if profile is incomplete
        // We rely on the profile_completed flag as the source of truth
        const isIncomplete = !profile?.profile_completed;

        if (isIncomplete && !hasChecked) {
            // Show dialog immediately for incomplete profiles
            setShowDialog(true);
            setHasChecked(true);
        } else {
            setHasChecked(true);
        }
    }, [user, profile, loading]);

    const handleComplete = () => {
        // Force refresh to update all contexts with new profile data
        window.location.reload();
    };

    const handleDialogChange = (open: boolean) => {
        // Prevent closing the dialog if the profile is not completed
        if (!open && (!profile || !profile.profile_completed)) {
            toast.error("Please complete your profile to continue");
            return;
        }
        setShowDialog(open);
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
