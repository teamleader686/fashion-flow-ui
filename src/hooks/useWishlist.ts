import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWishlist = () => {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            // For guest users, get from localStorage
            const saved = localStorage.getItem('wishlist');
            if (saved) setWishlist(JSON.parse(saved));
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('wishlist')
                .select('product_id')
                .eq('user_id', user.id);

            if (error) throw error;
            setWishlist(data.map(item => item.product_id));
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const toggleWishlist = async (productId: string) => {
        const isWishlisted = wishlist.includes(productId);

        // Update local state first for instant UX
        const newWishlist = isWishlisted
            ? wishlist.filter(id => id !== productId)
            : [...wishlist, productId];
        setWishlist(newWishlist);

        if (!user) {
            localStorage.setItem('wishlist', JSON.stringify(newWishlist));
            toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
            return;
        }

        try {
            if (isWishlisted) {
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('wishlist')
                    .insert({ user_id: user.id, product_id: productId });
                if (error) throw error;
            }
            toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        } catch (error: any) {
            console.error('Error toggling wishlist:', error);
            // Revert local state on error
            setWishlist(wishlist);
            toast.error('Failed to update wishlist');
        }
    };

    return {
        wishlist,
        toggleWishlist,
        loading,
        refresh: fetchWishlist
    };
};
