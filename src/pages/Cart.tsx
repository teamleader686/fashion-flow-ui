import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CloudImage from "@/components/ui/CloudImage";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalCoinsRequired, totalItems } = useCart();

  const shipping = totalPrice >= 999 ? 0 : 79;
  const finalTotal = totalPrice + shipping;

  const handleUpdateQuantity = (item: any, newQty: number) => {
    updateQuantity(item.product.id, newQty, item.selectedSize, item.selectedColor, item.isCoinItem);
  };

  const handleRemoveItem = (item: any) => {
    removeItem(item.product.id, item.selectedSize, item.selectedColor, item.isCoinItem);
    toast.success("Removed from cart");
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground mb-6">Add items to get started</p>
          <Link
            to="/products?category=all"
            className="inline-flex px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4 lg:py-8">
        <h1 className="text-xl lg:text-2xl font-bold mb-4">
          Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart items */}
          <div className="flex-1 space-y-3">
            {items.map((item) => (
              <motion.div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${item.isCoinItem}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border"
              >
                <Link to={`/product/${item.product.slug}`} className="w-24 h-32 sm:w-28 sm:h-36 rounded-lg overflow-hidden flex-shrink-0">
                  <CloudImage src={item.product.image} alt={item.product.name} className="w-full h-full" imageClassName="w-full h-full object-cover" />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.slug}`}>
                    <h3 className="font-medium text-sm sm:text-base truncate">{item.product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      Size: {item.selectedSize}
                    </span>
                    {item.selectedColor && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Color:</span>
                        <div
                          className="w-4 h-4 rounded-full border border-border"
                          style={{
                            backgroundColor: item.product.colors.find(c => c.name === item.selectedColor)?.hex || item.selectedColor
                          }}
                          title={item.selectedColor}
                        />
                      </div>
                    )}
                    {item.isCoinItem && (
                      <span className="text-[10px] font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                        Coin Purchase
                      </span>
                    )}
                  </div>

                  {item.isCoinItem ? (
                    <div className="flex items-center gap-1 mt-1 text-purple-700 font-bold">
                      <Coins className="h-4 w-4" />
                      <span>{item.coinPrice?.toLocaleString()} Coins</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bold">₹{item.product.price.toLocaleString()}</span>
                      <span className="text-original-price text-xs">₹{item.product.originalPrice.toLocaleString()}</span>
                      <span className="text-discount text-xs font-semibold">{item.product.discount}% off</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 border border-border rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                        className="p-1.5 hover:bg-secondary rounded-l-lg"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                        className="p-1.5 hover:bg-secondary rounded-r-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="p-2 text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:w-80">
            <div className="bg-card rounded-xl border border-border p-5 sticky top-20">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                {totalCoinsRequired > 0 && (
                  <div className="flex justify-between text-purple-700">
                    <span className="text-muted-foreground">Coins Redemption</span>
                    <span className="font-medium flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {totalCoinsRequired.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? "text-discount font-medium" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Free shipping on orders above ₹999
                  </p>
                )}
                <div className="border-t border-border pt-2.5 flex flex-col gap-1 font-bold text-base">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>₹{finalTotal.toLocaleString()}</span>
                  </div>
                  {totalCoinsRequired > 0 && (
                    <div className="flex justify-between text-purple-700 text-sm">
                      <span>Total Coins</span>
                      <span className="flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        {totalCoinsRequired.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full mt-4 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity text-center"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/products?category=all"
                className="block text-center text-sm text-primary font-medium mt-3 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
