"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Analytics {
  totalSales: number;
  mostSold: { id: string; name: string; quantity: number }[];
  leastSold: { id: string; name: string; quantity: number }[];
  topCustomers: { id: string; email: string; fullName?: string | null; total: number }[];
  categorySales: { name: string; total: number }[];
}

export function AnalyticsDashboard() {
  const { lang } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Analytics>("/api/analytics")
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }
  if (!data) return null;

  const tip =
    data.mostSold.length > 0 && data.mostSold[0]?.name
      ? t("tip1").replace("%s", data.mostSold[0].name)
      : data.categorySales.some((c) => c.total === 0)
        ? t("tip2").replace(
            "%s",
            data.categorySales.find((c) => c.total === 0)?.name ?? "",
          )
        : t("tip3");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("salesAnalytics")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              {t("totalSales30d")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-pink-600">
              {data.totalSales.toFixed(2)} {t("currency")}
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              {t("smartTips")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-indigo-700">{tip}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              {t("mostSold")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {data.mostSold.length === 0 && (
                <li className="text-sm text-gray-400">{t("noData")}</li>
              )}
              {data.mostSold.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-semibold">{p.quantity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              {t("leastSold")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {data.leastSold.length === 0 && (
                <li className="text-sm text-gray-400">{t("noData")}</li>
              )}
              {data.leastSold.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-semibold">{p.quantity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              {t("salesByCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {data.categorySales.length === 0 && (
                <li className="text-sm text-gray-400">{t("noData")}</li>
              )}
              {data.categorySales.map((c) => (
                <li key={c.name} className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="font-semibold">
                    {c.total.toFixed(2)} {t("currency")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
