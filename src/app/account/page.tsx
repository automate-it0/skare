"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { Loader2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  shippingName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingAddress: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { lang } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    api
      .get<{ orders: Order[] }>("/api/orders")
      .then((r) => setOrders(r.orders))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">{t("accountTitle")}</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("profileInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>{t("welcomeUser")} </strong>
              {session?.user?.name || ""}
            </p>
            <p>
              <strong>{t("emailPlaceholder")}: </strong>
              {session?.user?.email}
            </p>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">{t("orderHistory")}</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
          <Package className="h-12 w-12 text-gray-300" />
          <p>{t("noOrders")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">
                      {t("orderNumber")} #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("orderDate")}{" "}
                      {new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-pink-600">
                      {order.total.toFixed(2)} {t("currency")}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {t(
                        order.status === "NEW"
                          ? "newStatus"
                          : order.status === "SHIPPED"
                            ? "shippedStatus"
                            : order.status === "DELIVERED"
                              ? "deliveredStatus"
                              : "cancelledStatus",
                      )}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.name} (×{item.quantity})
                      </span>
                      <span>
                        {(item.price * item.quantity).toFixed(2)} {t("currency")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
