import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import product7 from "@/assets/product-7.jpg";
import product8 from "@/assets/product-8.jpg";

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

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export const categories: Category[] = [
  { id: "1", name: "Kurtis", slug: "kurtis", image: product2 },
  { id: "2", name: "Dresses", slug: "dresses", image: product4 },
  { id: "3", name: "Sarees", slug: "sarees", image: product3 },
  { id: "4", name: "Sets", slug: "sets", image: product5 },
  { id: "5", name: "Tops", slug: "tops", image: product6 },
  { id: "6", name: "Ethnic", slug: "ethnic", image: product7 },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Red Embroidered Anarkali Kurti",
    slug: "red-embroidered-anarkali-kurti",
    price: 1299,
    originalPrice: 2999,
    discount: 57,
    bestPrice: 1149,
    image: product1,
    images: [product1],
    rating: 4.5,
    reviewCount: 234,
    category: "kurtis",
    colors: ["#CC0000", "#1a1a5e", "#2d5a27"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    isFeatured: true,
    description: "Beautiful red anarkali kurti with intricate gold embroidery. Perfect for festive occasions and celebrations. Made from premium georgette fabric with a flattering flared silhouette.",
    stock: 45,
  },
  {
    id: "2",
    name: "Blue Printed Cotton Kurti Set",
    slug: "blue-printed-cotton-kurti-set",
    price: 899,
    originalPrice: 1799,
    discount: 50,
    bestPrice: 799,
    image: product2,
    images: [product2],
    rating: 4.2,
    reviewCount: 156,
    category: "kurtis",
    colors: ["#2563EB", "#DC2626", "#059669"],
    sizes: ["S", "M", "L", "XL"],
    description: "Comfortable blue printed cotton kurti with palazzo pants. Ideal for daily wear with a touch of elegance. Breathable cotton fabric for all-day comfort.",
    stock: 78,
  },
  {
    id: "3",
    name: "Green Silk Saree with Gold Border",
    slug: "green-silk-saree-gold-border",
    price: 2499,
    originalPrice: 5999,
    discount: 58,
    bestPrice: 2249,
    image: product3,
    images: [product3],
    rating: 4.8,
    reviewCount: 89,
    category: "sarees",
    colors: ["#166534", "#7C2D12", "#1E3A5F"],
    sizes: ["Free Size"],
    isNew: true,
    description: "Luxurious green silk saree with traditional gold zari border. A timeless piece for weddings and special occasions.",
    stock: 22,
  },
  {
    id: "4",
    name: "Yellow Floral Print Summer Dress",
    slug: "yellow-floral-print-dress",
    price: 699,
    originalPrice: 1499,
    discount: 53,
    bestPrice: 599,
    image: product4,
    images: [product4],
    rating: 4.3,
    reviewCount: 312,
    category: "dresses",
    colors: ["#EAB308", "#EC4899", "#06B6D4"],
    sizes: ["XS", "S", "M", "L", "XL"],
    isFeatured: true,
    description: "Cheerful yellow floral printed cotton dress. Perfect for summer outings. Features comfortable A-line silhouette with pockets.",
    stock: 120,
  },
  {
    id: "5",
    name: "Maroon Embroidered Ethnic Set",
    slug: "maroon-embroidered-ethnic-set",
    price: 1899,
    originalPrice: 3999,
    discount: 53,
    bestPrice: 1699,
    image: product5,
    images: [product5],
    rating: 4.6,
    reviewCount: 67,
    category: "sets",
    colors: ["#7F1D1D", "#1E3A5F", "#064E3B"],
    sizes: ["S", "M", "L", "XL"],
    description: "Elegant maroon embroidered ethnic dress set. Perfect for festive gatherings. Rich embroidery with comfortable fit.",
    stock: 35,
  },
  {
    id: "6",
    name: "White Chikankari Embroidered Kurti",
    slug: "white-chikankari-kurti",
    price: 999,
    originalPrice: 2299,
    discount: 57,
    bestPrice: 899,
    image: product6,
    images: [product6],
    rating: 4.7,
    reviewCount: 198,
    category: "kurtis",
    colors: ["#FAFAFA", "#FDE68A", "#FBCFE8"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    isNew: true,
    description: "Classic white Lucknowi chikankari kurti. Delicate hand-embroidered patterns on premium cotton fabric. Versatile for office and casual wear.",
    stock: 60,
  },
  {
    id: "7",
    name: "Pink Georgette Sharara Set",
    slug: "pink-georgette-sharara-set",
    price: 2199,
    originalPrice: 4499,
    discount: 51,
    bestPrice: 1999,
    image: product7,
    images: [product7],
    rating: 4.4,
    reviewCount: 45,
    category: "sets",
    colors: ["#EC4899", "#A855F7", "#F43F5E"],
    sizes: ["S", "M", "L", "XL"],
    isFeatured: true,
    description: "Stunning pink georgette sharara set with dupatta. Perfect wedding guest outfit with delicate embroidery and flowing fabric.",
    stock: 18,
  },
  {
    id: "8",
    name: "Navy Blue Embroidered A-Line Kurta",
    slug: "navy-blue-a-line-kurta",
    price: 799,
    originalPrice: 1699,
    discount: 53,
    bestPrice: 699,
    image: product8,
    images: [product8],
    rating: 4.1,
    reviewCount: 278,
    category: "kurtis",
    colors: ["#1E3A5F", "#000000", "#4A5568"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Sophisticated navy blue A-line kurta with subtle gold embroidery. Perfect for office wear. Premium cotton blend fabric.",
    stock: 95,
  },
];

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}
