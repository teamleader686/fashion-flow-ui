import { useState } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProfile = () => {
    const { user, profile: currentProfile } = useAuth();
    const [updating, setUpdating] = useState(false);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return;

        try {
            setUpdating(true);
            const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', user.id);

            if (error) throw error;
            toast.success('Profile updated successfully');

            // Note: We don't update the context here directly because AuthContext 
            // usually refetches on change or needs a manual refetch call if we added one.
            // For now, we rely on the toast and the user might need to refresh or 
            // we can implement a reload in AuthContext if needed.
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile');
            throw err;
        } finally {
            setUpdating(false);
        }
    };

    return {
        profile: currentProfile,
        updating,
        updateProfile
    };
};
