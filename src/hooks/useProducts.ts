import { useState, useEffect } from 'react';
import { supabase, Product as DBProduct } from '@/lib/supabase';

// Transform database product to match frontend interface
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
  loyaltyCoins?: number; // Earned coins
  loyaltyPrice?: number | null; // Price in coins
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchProducts outside useEffect to avoid closure issues
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          product_images(image_url, is_primary, display_order),
          product_variants(size, color, color_code, stock_quantity)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform database products to frontend format
      const transformedProducts: Product[] = (data || []).map((dbProduct: any) => {
        const primaryImage = dbProduct.product_images?.find((img: any) => img.is_primary);
        const allImages = dbProduct.product_images
          ?.sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => img.image_url) || [];

        // Extract sizes from direct column or variants fallback
        let sizes: string[] = dbProduct.available_sizes || [];
        if (sizes.length === 0) {
          sizes = [...new Set(dbProduct.product_variants?.map((v: any) => v.size).filter(Boolean) as string[] || [])];
        }

        // Extract colors from direct column or variants fallback
        let colors: { name: string; hex: string }[] = dbProduct.available_colors || [];
        if (colors.length === 0) {
          // Fallback logic for old variant structure if needed
          const variantColors = dbProduct.product_variants?.filter((v: any) => v.color).map((v: any) => ({
            name: v.color,
            hex: v.color_code || '#000000' // Default to black if no code
          })) || [];

          // Deduplicate by name
          const uniqueColors = new Map();
          variantColors.forEach((c: any) => {
            if (!uniqueColors.has(c.name)) uniqueColors.set(c.name, c);
          });
          colors = Array.from(uniqueColors.values());
        }

        // Calculate discount percentage
        const discount = dbProduct.compare_at_price
          ? Math.round(((dbProduct.compare_at_price - dbProduct.price) / dbProduct.compare_at_price) * 100)
          : 0;

        // Calculate best price (10% less than current price for display)
        const bestPrice = Math.round(dbProduct.price * 0.9);

        // Calculate total stock from variants or main stock
        const totalStock = dbProduct.product_variants?.reduce(
          (sum: number, v: any) => sum + (v.stock_quantity || 0),
          0
        ) || dbProduct.stock_quantity || 0;

        return {
          id: dbProduct.id,
          name: dbProduct.name,
          slug: dbProduct.slug,
          price: dbProduct.price,
          originalPrice: dbProduct.compare_at_price || dbProduct.price,
          discount,
          bestPrice,
          image: primaryImage?.image_url || allImages[0] || '/placeholder.svg',
          images: allImages.length > 0 ? allImages : ['/placeholder.svg'],
          rating: 4.5, // Default rating (can be calculated from reviews later)
          reviewCount: 0, // Can be calculated from reviews table later
          category: dbProduct.category?.slug || 'uncategorized',
          colors,
          sizes,
          isNew: dbProduct.is_new_arrival || false,
          isFeatured: dbProduct.is_featured || false,
          description: dbProduct.description || '',
          stock: totalStock,
          loyaltyCoins: dbProduct.loyalty_coins_reward || 0,
          loyaltyPrice: dbProduct.loyalty_coins_price || null,
        };
      });

      setProducts(transformedProducts);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch products immediately on mount
    fetchProducts();

    // Setup realtime subscription
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return { products, loading, error, refetch: fetchProducts };
};

// Hook to fetch categories
export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchCategories outside useEffect
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      setCategories([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch categories immediately on mount
    fetchCategories();

    // Setup realtime subscription for categories
    const subscription = supabase
      .channel('categories_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return { categories, loading, error, refetch: fetchCategories };
};
