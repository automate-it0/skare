"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { ProductCard, type Product } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  children?: Category[];
}

export function HomePageContent() {
  const { lang } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const sp = useSearchParams();
  const searchTerm = sp.get("q") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ products: Product[] }>("/api/products"),
      api.get<{ categories: Category[] }>("/api/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p.products);
        setCategories(c.categories);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      const cat = categories.find((c) => c.id === selectedCategory);
      const childIds = cat?.children?.map((c) => c.id) ?? [];
      const ids = [selectedCategory, ...childIds];
      list = list.filter((p) => p.categoryId && ids.includes(p.categoryId));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCategory, categories, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 sm:p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-800">
          {t("welcomeMessage")}
        </h1>
        <p className="text-lg text-gray-600 mt-2">{t("welcomeSubMessage")}</p>
      </div>

      {/* Category filters */}
      <div className="flex justify-center flex-wrap gap-2 mb-8">
        <Button
          onClick={() => setSelectedCategory(null)}
          variant={selectedCategory === null ? "default" : "outline"}
          className={
            selectedCategory === null
              ? "bg-pink-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }
          size="sm"
        >
          {t("allCategories")}
        </Button>
        {categories.map((cat) => (
          <div key={cat.id} className="flex flex-col items-center gap-1">
            <Button
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id,
                )
              }
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className={
                selectedCategory === cat.id
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
              size="sm"
            >
              {cat.name}
            </Button>
            {cat.children &&
              cat.children.length > 0 &&
              selectedCategory === cat.id && (
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {cat.children.map((child) => (
                    <Button
                      key={child.id}
                      onClick={() => setSelectedCategory(child.id)}
                      variant={
                        selectedCategory === child.id ? "default" : "outline"
                      }
                      size="sm"
                      className={
                        selectedCategory === child.id
                          ? "bg-pink-500 text-white text-xs"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs"
                      }
                    >
                      - {child.name}
                    </Button>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-gray-500">
            لا توجد منتجات حالياً. أضف أول منتج لك من لوحة التحكم!
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-gray-500">{t("noProductsFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
