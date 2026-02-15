import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";
import { CategorySkeleton } from "@/components/shimmer/CategorySkeleton";

const CategoryCircles = () => {
  const { categories, loading } = useCategories();

  if (loading) {
    return <CategorySkeleton />;
  }

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className="py-4 lg:py-8 overflow-hidden">
      <div className="container px-0 sm:px-6">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide pt-2 pb-4 snap-x snap-mandatory px-4 sm:px-0 lg:justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-3 flex-shrink-0 snap-center first:pl-2 last:pr-2 sm:first:pl-0 sm:last:pr-0"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-2 ring-offset-2 ring-primary/20 hover:ring-primary transition-all duration-300 shadow-sm">
                <img
                  src={cat.image_url || '/placeholder.svg'}
                  alt={cat.name}
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-foreground/80 uppercase tracking-widest text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCircles;
