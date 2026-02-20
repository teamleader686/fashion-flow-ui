import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  discount: number;
  bestPrice: number;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  category: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  description: string;
  stock: number;
  loyaltyCoins?: number;
  loyaltyPrice?: number | null;
  shippingCharge: number;
}

const transformProduct = (dbProduct: any): Product => {
  const primaryImage = dbProduct.product_images?.find((img: any) => img.is_primary);
  const allImages = dbProduct.product_images
    ?.sort((a: any, b: any) => a.display_order - b.display_order)
    .map((img: any) => img.image_url) || [];

  let sizes: string[] = dbProduct.available_sizes || [];
  if (sizes.length === 0) {
    sizes = [...new Set(
      (dbProduct.product_variants?.map((v: any) => v.size).filter(Boolean) as string[]) || []
    )];
  }

  let colors: { name: string; hex: string }[] = dbProduct.available_colors || [];
  if (colors.length === 0) {
    const variantColors = dbProduct.product_variants
      ?.filter((v: any) => v.color)
      .map((v: any) => ({ name: v.color, hex: v.color_code || '#000000' })) || [];
    const uniqueColors = new Map();
    variantColors.forEach((c: any) => { if (!uniqueColors.has(c.name)) uniqueColors.set(c.name, c); });
    colors = Array.from(uniqueColors.values());
  }

  const discount = dbProduct.compare_at_price
    ? Math.round(((dbProduct.compare_at_price - dbProduct.price) / dbProduct.compare_at_price) * 100)
    : 0;

  const totalStock = dbProduct.product_variants?.reduce(
    (sum: number, v: any) => sum + (v.stock_quantity || 0), 0
  ) || dbProduct.stock_quantity || 0;

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    price: dbProduct.price,
    originalPrice: dbProduct.compare_at_price || dbProduct.price,
    discount,
    bestPrice: Math.round(dbProduct.price * 0.9),
    image: primaryImage?.image_url || allImages[0] || '/placeholder.svg',
    images: allImages.length > 0 ? allImages : ['/placeholder.svg'],
    rating: 4.5,
    reviewCount: 0,
    category: dbProduct.category?.slug || 'uncategorized',
    colors,
    sizes,
    isNew: dbProduct.is_new_arrival || false,
    isFeatured: dbProduct.is_featured || false,
    description: dbProduct.description || '',
    stock: totalStock,
    loyaltyCoins: dbProduct.loyalty_coins_reward || 0,
    loyaltyPrice: dbProduct.loyalty_coins_price || null,
    shippingCharge: dbProduct.shipping_charge || 0,
  };
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          id, name, slug, price, compare_at_price, description,
          is_new_arrival, is_featured, stock_quantity, shipping_charge,
          loyalty_coins_reward, loyalty_coins_price, available_sizes, available_colors,
          category:categories(name, slug),
          product_images(image_url, is_primary, display_order),
          product_variants(size, color, color_code, stock_quantity)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts((data || []).map(transformProduct));
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, name, slug, image_url, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    const subscription = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
};
