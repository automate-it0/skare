"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { Loader2, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api
      .get<{ products: Product[] }>(`/api/products`)
      .then((r) => {
        const found = r.products.find((p) => p.id === params.id);
        setProduct(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const addToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await api.post("/api/cart", { productId: product.id, quantity: 1 });
      notify("success", t("addedToCart"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        notify("error", t("loginToAdd"));
        setTimeout(() => {
          window.location.href = "/auth";
        }, 800);
        return;
      }
      notify("error", t("orderError"));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="text-center py-20 text-xl text-gray-500">
        {t("productNotFound")}
      </div>
    );
  }

  const hasSale = product.salePrice && product.salePrice < product.price;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow bg-gray-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {t("noImageSelected")}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold">{product.name}</h1>
          <div className="flex items-baseline gap-3">
            {hasSale ? (
              <>
                <p className="text-3xl font-bold text-red-500">
                  {product.salePrice} {t("currency")}
                </p>
                <p className="text-xl text-gray-400 line-through">
                  {product.price} {t("currency")}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-pink-600">
                {product.price} {t("currency")}
              </p>
            )}
          </div>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description || ""}
          </p>
          <Button
            onClick={addToCart}
            className="w-full bg-pink-600 hover:bg-pink-700 text-lg py-6"
            disabled={adding}
          >
            {adding ? (
              <Loader2 className="h-5 w-5 me-2 animate-spin" />
            ) : (
              <Plus className="h-5 w-5 me-2" />
            )}
            {t("addToCart")}
          </Button>
        </div>
      </div>
    </div>
  );
}
