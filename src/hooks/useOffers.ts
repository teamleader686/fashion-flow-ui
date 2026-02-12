import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Offer, OfferFormData, ProductOffer, OfferPrice } from '@/types/offer';

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const createOffer = async (offerData: OfferFormData) => {
    const { data: user } = await supabase.auth.getUser();

    // Create offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .insert([{
        title: offerData.title,
        type: offerData.type,
        discount_value: offerData.discount_value,
        max_discount: offerData.max_discount,
        min_order_amount: offerData.min_order_amount,
        scope_type: offerData.scope_type,
        start_datetime: offerData.start_datetime,
        end_datetime: offerData.end_datetime,
        badge_text: offerData.badge_text,
        badge_color: offerData.badge_color,
        status: offerData.status,
        priority: offerData.priority,
        stock_limit: offerData.stock_limit,
        stock_remaining: offerData.stock_limit,
        created_by: user.user?.id
      }])
      .select()
      .single();

    if (offerError) throw offerError;

    // Add product mappings
    if (offerData.scope_type === 'products' && offerData.product_ids.length > 0) {
      const productMappings = offerData.product_ids.map(productId => ({
        offer_id: offer.id,
        product_id: productId
      }));

      const { error: productError } = await supabase
        .from('offer_products')
        .insert(productMappings);

      if (productError) throw productError;
    }

    // Add category mappings
    if (offerData.scope_type === 'categories' && offerData.category_ids.length > 0) {
      const categoryMappings = offerData.category_ids.map(categoryId => ({
        offer_id: offer.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('offer_categories')
        .insert(categoryMappings);

      if (categoryError) throw categoryError;
    }

    await fetchOffers();
    return offer;
  };

  const updateOffer = async (id: string, offerData: Partial<OfferFormData>) => {
    const { data, error } = await supabase
      .from('offers')
      .update({
        title: offerData.title,
        type: offerData.type,
        discount_value: offerData.discount_value,
        max_discount: offerData.max_discount,
        min_order_amount: offerData.min_order_amount,
        start_datetime: offerData.start_datetime,
        end_datetime: offerData.end_datetime,
        badge_text: offerData.badge_text,
        badge_color: offerData.badge_color,
        status: offerData.status,
        priority: offerData.priority,
        stock_limit: offerData.stock_limit
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update product mappings if provided
    if (offerData.product_ids !== undefined) {
      // Delete existing
      await supabase.from('offer_products').delete().eq('offer_id', id);
      
      // Insert new
      if (offerData.product_ids.length > 0) {
        const productMappings = offerData.product_ids.map(productId => ({
          offer_id: id,
          product_id: productId
        }));
        await supabase.from('offer_products').insert(productMappings);
      }
    }

    // Update category mappings if provided
    if (offerData.category_ids !== undefined) {
      // Delete existing
      await supabase.from('offer_categories').delete().eq('offer_id', id);
      
      // Insert new
      if (offerData.category_ids.length > 0) {
        const categoryMappings = offerData.category_ids.map(categoryId => ({
          offer_id: id,
          category_id: categoryId
        }));
        await supabase.from('offer_categories').insert(categoryMappings);
      }
    }

    await fetchOffers();
    return data;
  };

  const deleteOffer = async (id: string) => {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchOffers();
  };

  const toggleOfferStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateOffer(id, { status: newStatus } as any);
  };

  return {
    offers,
    loading,
    error,
    createOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    refetch: fetchOffers
  };
}

export function useProductOffer(productId: string, categoryId?: string) {
  const [offer, setOffer] = useState<ProductOffer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductOffer = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_product_offer', {
          p_product_id: productId,
          p_category_id: categoryId || null
        });

        if (error) throw error;
        setOffer(data && data.length > 0 ? data[0] : null);
      } catch (err) {
        console.error('Error fetching product offer:', err);
        setOffer(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductOffer();
    }
  }, [productId, categoryId]);

  return { offer, loading };
}

export function useCalculateOfferPrice(
  originalPrice: number,
  productId: string,
  categoryId?: string
): OfferPrice {
  const { offer, loading } = useProductOffer(productId, categoryId);

  if (loading || !offer) {
    return {
      original_price: originalPrice,
      offer_price: originalPrice,
      discount_amount: 0,
      discount_percentage: 0,
      has_offer: false
    };
  }

  let discountAmount = 0;

  if (offer.type === 'flat') {
    discountAmount = Math.min(offer.discount_value, originalPrice);
  } else if (offer.type === 'percentage') {
    discountAmount = (originalPrice * offer.discount_value) / 100;
    if (offer.max_discount) {
      discountAmount = Math.min(discountAmount, offer.max_discount);
    }
  } else if (offer.type === 'bogo') {
    discountAmount = originalPrice / 2;
  }

  const offerPrice = Math.max(originalPrice - discountAmount, 0);
  const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

  return {
    original_price: originalPrice,
    offer_price: offerPrice,
    discount_amount: discountAmount,
    discount_percentage: discountPercentage,
    has_offer: true,
    offer
  };
}

export function useActiveOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('status', 'active')
          .lte('start_datetime', new Date().toISOString())
          .gte('end_datetime', new Date().toISOString())
          .order('priority', { ascending: false });

        if (error) throw error;
        setOffers(data || []);
      } catch (err) {
        console.error('Error fetching active offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOffers();
  }, []);

  return { offers, loading };
}
