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
  colors: string[];
  sizes: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  description: string;
  stock: number;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const fetchProducts = async () => {
    try {
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

        // Extract unique sizes and colors
        const sizes = [...new Set(dbProduct.product_variants?.map((v: any) => v.size) || [])];
        const colors = [...new Set(dbProduct.product_variants?.map((v: any) => v.color_code) || [])];

        // Calculate discount percentage
        const discount = dbProduct.compare_at_price 
          ? Math.round(((dbProduct.compare_at_price - dbProduct.price) / dbProduct.compare_at_price) * 100)
          : 0;

        // Calculate best price (10% less than current price for display)
        const bestPrice = Math.round(dbProduct.price * 0.9);

        // Calculate total stock from variants
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
        };
      });

      setProducts(transformedProducts);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: fetchProducts };
};

// Hook to fetch categories
export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, refetch: fetchCategories };
};
