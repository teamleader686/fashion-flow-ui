import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGridSkeleton } from "@/components/shimmer/ProductCardSkeleton";
import { ShimmerText, ShimmerCard } from "@/components/ui/shimmer";
import { supabase } from "@/lib/supabase";

const sortOptions = [
  { label: "Popularity", value: "popular" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest First", value: "newest" },
  { label: "Discount", value: "discount" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";

  const { categories, loading: categoriesLoading } = useCategories();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          product_images(image_url, is_primary, display_order),
          product_variants(size, color, color_code, stock_quantity)
        `)
        .eq('is_active', true);

      if (categoryParam !== "all") {
        query = query.not('category', 'is', null).filter('category.slug', 'eq', categoryParam);
      }

      if (searchQuery) {
        const q = `%${searchQuery.toLowerCase()}%`;
        query = query.or(`name.ilike.${q},description.ilike.${q}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } else if (data) {
        // Transform data
        const transformed = data.map((dbProduct: any) => {
          const primaryImage = dbProduct.product_images?.find((img: any) => img.is_primary);
          const allImages = dbProduct.product_images
            ?.sort((a: any, b: any) => a.display_order - b.display_order)
            .map((img: any) => img.image_url) || [];

          return {
            id: dbProduct.id,
            name: dbProduct.name,
            slug: dbProduct.slug,
            price: dbProduct.price,
            originalPrice: dbProduct.compare_at_price || dbProduct.price,
            discount: dbProduct.compare_at_price ? Math.round(((dbProduct.compare_at_price - dbProduct.price) / dbProduct.compare_at_price) * 100) : 0,
            bestPrice: Math.round(dbProduct.price * 0.9),
            image: primaryImage?.image_url || allImages[0] || '/placeholder.svg',
            images: allImages.length > 0 ? allImages : ['/placeholder.svg'],
            rating: 4.5,
            reviewCount: 0,
            category: dbProduct.category?.slug || 'uncategorized',
            colors: [], // Simplified
            sizes: [], // Simplified
            isNew: dbProduct.is_new_arrival || false,
            isFeatured: dbProduct.is_featured || false,
            description: dbProduct.description || '',
            stock: dbProduct.stock_quantity || 0,
            loyaltyCoins: dbProduct.loyalty_coins_reward || 0,
            loyaltyPrice: dbProduct.loyalty_coins_price || null,
          };
        });

        setProducts(transformed);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [categoryParam, searchQuery]);

  const [sortBy, setSortBy] = useState("popular");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const allSizes = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryParam !== "all") {
      result = result.filter((p) => p.category === categoryParam);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        result.sort((a, b) => b.discount - a.discount);
        break;
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return result;
  }, [categoryParam, searchQuery, sortBy, priceRange, selectedSizes]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  const categoryTitle = categoryParam === "all"
    ? searchQuery ? `Search: "${searchQuery}"` : "All Products"
    : categories.find((c) => c.slug === categoryParam)?.name || "Products";

  const isLoading = loading || categoriesLoading;

  return (
    <Layout>
      <div className="container py-4 lg:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">{categoryTitle}</h1>
            <p className="text-sm text-muted-foreground">{filteredProducts.length} products</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          <button
            onClick={() => setSearchParams({ category: "all" })}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${categoryParam === "all"
              ? "bg-foreground text-card border-foreground"
              : "border-border text-foreground hover:bg-secondary"
              }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.slug })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${categoryParam === cat.slug
                ? "bg-foreground text-card border-foreground"
                : "border-border text-foreground hover:bg-secondary"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex gap-6 mt-4">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-60 flex-shrink-0 space-y-6">
            <div>
              <h3 className="font-semibold text-sm mb-3">Sort By</h3>
              <div className="space-y-1.5">
                {sortOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === opt.value}
                      onChange={() => setSortBy(opt.value)}
                      className="accent-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Price Range</h3>
              <div className="flex items-center gap-2 text-sm">
                <span>₹{priceRange[0]}</span>
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={100}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1 accent-primary"
                />
                <span>₹{priceRange[1]}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${selectedSizes.includes(size)
                      ? "bg-foreground text-card border-foreground"
                      : "border-border hover:bg-secondary"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Mobile sort */}
            <div className="lg:hidden mb-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-muted-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-foreground/50 z-50"
                onClick={() => setShowFilters(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl z-50 max-h-[70vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Price Range</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span>₹{priceRange[0]}</span>
                      <input
                        type="range"
                        min={0}
                        max={10000}
                        step={100}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="flex-1 accent-primary"
                      />
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Size</h4>
                    <div className="flex flex-wrap gap-2">
                      {allSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${selectedSizes.includes(size)
                            ? "bg-foreground text-card border-foreground"
                            : "border-border hover:bg-secondary"
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Products;
