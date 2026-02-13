import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserAddress {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    zip_code: string;
    state: string;
    city: string;
    address_line1: string;
    address_line2?: string;
    landmark?: string;
    address_type: 'Home' | 'Work' | 'Other';
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

const toTitleCase = (str: string): 'Home' | 'Work' | 'Other' => {
    if (!str) return 'Home';
    const lower = str.toLowerCase();
    if (lower === 'work') return 'Work';
    if (lower === 'other') return 'Other';
    return 'Home';
};

export const useAddresses = () => {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAddresses = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map DB lowercase types to UI TitleCase types
            const mappedData = (data || []).map((addr: any) => ({
                ...addr,
                address_type: toTitleCase(addr.address_type)
            }));

            setAddresses(mappedData);
        } catch (err: any) {
            console.error('Error fetching addresses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const addAddress = async (address: Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if (!user) return;

        try {
            // Convert to lowercase for DB constraint
            const dbAddress = {
                ...address,
                user_id: user.id,
                address_type: address.address_type.toLowerCase()
            };

            const { data, error } = await supabase
                .from('user_addresses')
                .insert([dbAddress])
                .select()
                .single();

            if (error) throw error;

            // Map response back to UI format
            const savedAddress = {
                ...data,
                address_type: toTitleCase(data.address_type)
            };

            setAddresses(prev => [savedAddress, ...prev]);
            toast.success('Address added successfully');
            return savedAddress;
        } catch (err: any) {
            console.error("Error in addAddress:", err);
            toast.error(err.message || 'Failed to add address');
            throw err;
        }
    };

    const updateAddress = async (id: string, address: Partial<UserAddress>) => {
        try {
            // Convert to lowercase for DB if present
            const dbUpdate = { ...address };
            if (dbUpdate.address_type) {
                // @ts-ignore
                dbUpdate.address_type = dbUpdate.address_type.toLowerCase();
            }

            const { data, error } = await supabase
                .from('user_addresses')
                .update(dbUpdate)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Map response back to UI format
            const updatedAddress = {
                ...data,
                address_type: toTitleCase(data.address_type)
            };

            setAddresses(prev => prev.map(a => a.id === id ? updatedAddress : a));
            toast.success('Address updated successfully');
            return updatedAddress;
        } catch (err: any) {
            toast.error(err.message || 'Failed to update address');
            throw err;
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            const { error } = await supabase
                .from('user_addresses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setAddresses(prev => prev.filter(a => a.id !== id));
            toast.success('Address deleted successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete address');
            throw err;
        }
    };

    const setDefaultAddress = async (id: string) => {
        try {
            const { error } = await supabase
                .from('user_addresses')
                .update({ is_default: true })
                .eq('id', id);

            if (error) throw error;

            // The trigger in DB handles unsetting other defaults, but we need to update local state
            setAddresses(prev => prev.map(a => ({
                ...a,
                is_default: a.id === id
            })));

            toast.success('Default address updated');
        } catch (err: any) {
            toast.error(err.message || 'Failed to set default address');
            throw err;
        }
    };

    return {
        addresses,
        loading,
        error,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        refetch: fetchAddresses
    };
};
