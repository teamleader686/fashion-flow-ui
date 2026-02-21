import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Slider } from '@/types/slider';
import { useToast } from '@/hooks/use-toast';
import storageLogger from '@/lib/storageLogger';

export const useSliders = () => {
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('sliders')
                .select('*')
                .order('display_order', { ascending: true });

            if (fetchError) {
                // If table doesn't exist, we'll handle it gracefully
                if (fetchError.code === '42P01' || fetchError.code === 'PGRST205') {
                    console.warn('Sliders table does not exist. Please run the SQL migration.');
                    setSliders([]);
                } else {
                    throw fetchError;
                }
            } else {
                setSliders(data || []);
            }
            setError(null);
        } catch (err: any) {
            console.error('Error fetching sliders:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addSlider = async (slider: Partial<Slider>) => {
        try {
            const { data, error: addError } = await supabase
                .from('sliders')
                .insert([slider])
                .select();

            if (addError) throw addError;

            toast({
                title: "Success",
                description: "Slider added successfully",
            });

            fetchSliders();

            // Log slider creation
            storageLogger.logCreate('sliders', data[0].id, 100); // Estimating 100KB for text+metadata

            return data[0];
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
            return null;
        }
    };

    const updateSlider = async (id: string, updates: Partial<Slider>) => {
        try {
            const { error: updateError } = await supabase
                .from('sliders')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            toast({
                title: "Success",
                description: "Slider updated successfully",
            });

            fetchSliders();
            return true;
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
            return false;
        }
    };

    const deleteSlider = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('sliders')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            toast({
                title: "Success",
                description: "Slider deleted successfully",
            });

            // Log slider deletion
            storageLogger.logDelete('sliders', id, 100);

            fetchSliders();
            return true;
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
            return false;
        }
    };

    useEffect(() => {
        let mounted = true;
        if (mounted) fetchSliders();

        let subscription: any;
        try {
            subscription = supabase
                .channel(`sliders_changes_${Date.now()}`)
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'sliders' },
                    () => {
                        if (mounted) fetchSliders();
                    }
                )
                .subscribe((status, err) => {
                    if (err) console.error("Realtime subscription error in sliders:", err);
                });
        } catch (e) {
            console.error("Failed to setup real-time subscription for sliders", e);
        }

        return () => {
            mounted = false;
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, []);

    return { sliders, loading, error, refetch: fetchSliders, addSlider, updateSlider, deleteSlider };
};
