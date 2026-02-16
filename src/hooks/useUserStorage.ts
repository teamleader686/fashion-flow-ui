import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStorageData {
    totalKB: number;
    totalMB: number;
    uploadCount: number;
    lastUploadAt: string | null;
}

const DEFAULT_DATA: UserStorageData = {
    totalKB: 0,
    totalMB: 0,
    uploadCount: 0,
    lastUploadAt: null,
};

export const useUserStorage = () => {
    const { user } = useAuth();
    const [data, setData] = useState<UserStorageData>(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);

    const fetchUserStorage = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Try user_storage_usage table first
            const { data: usageData } = await supabase
                .from('user_storage_usage')
                .select('total_kb, upload_count, last_upload_at')
                .eq('user_id', user.id)
                .maybeSingle();

            if (usageData) {
                setData({
                    totalKB: Number(usageData.total_kb) || 0,
                    totalMB: (Number(usageData.total_kb) || 0) / 1024,
                    uploadCount: usageData.upload_count || 0,
                    lastUploadAt: usageData.last_upload_at,
                });
            } else {
                // Fallback: Query storage_logs directly
                try {
                    const { data: logData } = await supabase.rpc('get_user_storage_summary', {
                        p_user_id: user.id,
                    });
                    if (logData && logData.length > 0) {
                        const totalKB = Number(logData[0].total_kb) || 0;
                        setData({
                            totalKB,
                            totalMB: totalKB / 1024,
                            uploadCount: Number(logData[0].upload_count) || 0,
                            lastUploadAt: null,
                        });
                    }
                } catch {
                    // Tables not created yet — silent
                }
            }
        } catch (err) {
            console.warn('[useUserStorage] Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchUserStorage();
    }, [fetchUserStorage]);

    return { data, loading, refetch: fetchUserStorage };
};
