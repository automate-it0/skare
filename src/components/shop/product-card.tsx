"use client";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api-client";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  category?: { id: string; name: string } | null;
  categoryId?: string | null;
}

export function ProductCard({ product }: { product: Product }) {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const hasSale = product.salePrice && product.salePrice < product.price;

  const addToCart = async () => {
    try {
      await api.post("/api/cart", { productId: product.id, quantity: 1 });
      notify("success", t("addedToCart"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        notify("error", t("loginToAdd"));
        // Delay redirect so user sees the toast
        setTimeout(() => {
          window.location.href = "/auth";
        }, 800);
        return;
      }
      notify("error", t("orderError"));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group transition-transform duration-300 hover:-translate-y-1 flex flex-col">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative w-full h-56 bg-gray-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              {t("noImageSelected")}
            </div>
          )}
          {hasSale && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {t("discount")}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {product.name}
          </h3>
          <div className="mt-4 flex items-center justify-between">
            {hasSale ? (
              <div>
                <p className="text-xl font-bold text-red-500">
                  {product.salePrice} {t("currency")}
                </p>
                <p className="text-sm text-gray-500 line-through">
                  {product.price} {t("currency")}
                </p>
              </div>
            ) : (
              <p className="text-xl font-bold text-pink-600">
                {product.price} {t("currency")}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="p-4 pt-0 mt-auto">
        <Button
          onClick={addToCart}
          className="w-full bg-pink-100 text-pink-700 hover:bg-pink-200 hover:text-pink-800 font-bold"
          variant="ghost"
          size="sm"
        >
          <Plus className="h-4 w-4 me-1" />
          {t("addToCart")}
        </Button>
      </div>
    </div>
  );
}
