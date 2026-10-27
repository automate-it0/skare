"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { api } from "@/lib/api-client";

interface CartItem {
  id: string;
  quantity: number;
}

export function ShopShell({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ cart: CartItem[] }>("/api/cart")
      .then((r) => {
        if (!cancelled) {
          setCartCount(r.cart.reduce((s, i) => s + i.quantity, 0));
        }
      })
      .catch(() => {
        // 401 means not logged in - cart is empty
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="font-sans bg-gray-50 text-gray-900 flex flex-col min-h-screen">
      <Header cartCount={cartCount} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
