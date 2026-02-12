import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";

const CategoryCircles = () => {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <section className="py-6 lg:py-10">
        <div className="container">
          <div className="text-center text-muted-foreground">Loading categories...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 lg:py-10">
      <div className="container">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-2 justify-start lg:justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden ring-2 ring-offset-2 ring-primary/30 hover:ring-primary transition-all">
                <img
                  src={cat.image_url || '/placeholder.svg'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground uppercase tracking-wide">
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
