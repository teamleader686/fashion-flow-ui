import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product } from "@/hooks/useProducts";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  isCoinItem?: boolean;
  coinPrice?: number;
  offer?: any;
  offerPrice?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string, isCoinItem?: boolean, offer?: any) => void;
  removeItem: (productId: string, size?: string, color?: string, isCoinItem?: boolean) => void;
  updateQuantity: (productId: string, qty: number, size?: string, color?: string, isCoinItem?: boolean) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalCoinsRequired: number;
  totalShippingCost: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

import { useWishlist } from "@/hooks/useWishlist";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { wishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();

  const addItem = useCallback((product: Product, selectedSize: string, selectedColor: string, isCoinItem: boolean = false, offer: any = null) => {
    setItems((prev) => {
      const existing = prev.find((i) =>
        i.product.id === product.id &&
        i.selectedSize === selectedSize &&
        i.selectedColor === selectedColor &&
        !!i.isCoinItem === isCoinItem
      );

      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id &&
            i.selectedSize === selectedSize &&
            i.selectedColor === selectedColor &&
            !!i.isCoinItem === isCoinItem
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        product,
        quantity: 1,
        selectedSize,
        selectedColor,
        isCoinItem,
        coinPrice: isCoinItem ? (product.loyaltyPrice || 0) : undefined,
        offer: offer,
        offerPrice: offer ? offer.final_price : product.price
      }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size?: string, color?: string, isCoinItem?: boolean) => {
    setItems((prev) => prev.filter((i) => {
      if (size !== undefined && color !== undefined) {
        return !(i.product.id === productId && i.selectedSize === size && i.selectedColor === color && !!i.isCoinItem === !!isCoinItem);
      }
      return i.product.id !== productId;
    }));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number, size?: string, color?: string, isCoinItem?: boolean) => {
    if (qty <= 0) {
      if (size !== undefined && color !== undefined) {
        removeItem(productId, size, color, isCoinItem);
      } else {
        removeItem(productId);
      }
      return;
    }
    setItems((prev) => prev.map((i) => {
      if (i.product.id === productId) {
        if (size !== undefined && color !== undefined) {
          // Precise match update
          if (i.selectedSize === size && i.selectedColor === color && !!i.isCoinItem === !!isCoinItem) {
            return { ...i, quantity: qty };
          }
          return i;
        }
        // Fallback if only productId provided (legacy behavior, might update multiple if ambiguous)
        return { ...i, quantity: qty };
      }
      return i;
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const totalPrice = items.reduce((sum, i) => {
    if (i.isCoinItem) return sum;

    // Handle BOGO
    if (i.offer?.type === 'bogo') {
      const freeItems = Math.floor(i.quantity / 2);
      const paidItems = i.quantity - freeItems;
      return sum + (paidItems * i.product.price);
    }

    // Handle other offers
    if (i.offerPrice !== undefined) {
      return sum + (i.offerPrice * i.quantity);
    }

    return sum + (i.product.price * i.quantity);
  }, 0);

  const totalCoinsRequired = items.reduce((sum, i) => sum + (i.isCoinItem && i.coinPrice ? i.coinPrice * i.quantity : 0), 0);
  // Calculate unique products shipping charge sum - once per product type
  const totalShippingCost = items.reduce((sum, i) => {
    // If it's a coin item, maybe shipping is still applicable? User didn't specify. Assuming yes.
    return sum + (i.product.shippingCharge || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, totalCoinsRequired, totalShippingCost, wishlist, toggleWishlist }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
