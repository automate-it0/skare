"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { Loader2, Eye } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  shippingName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingAddress: string;
  deliveryFee: number;
  discountAmount: number;
  appliedCouponCode?: string | null;
  items: OrderItem[];
  user?: { email: string; fullName?: string | null };
}

export function OrderManagement() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = () => {
    api
      .get<{ orders: Order[] }>("/api/orders/all")
      .then((r) => setOrders(r.orders))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/orders/${id}/status`, { status });
      notify("success", t("updateStatus"));
      load();
    } catch {
      notify("error", t("orderError"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("manageOrders")}</h2>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("orderNumber")}</TableHead>
              <TableHead>{t("customerName")}</TableHead>
              <TableHead>{t("finalTotal")}</TableHead>
              <TableHead>{t("orderStatus")}</TableHead>
              <TableHead>{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>#{o.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>{o.shippingName}</TableCell>
                <TableCell>
                  {o.total.toFixed(2)} {t("currency")}
                </TableCell>
                <TableCell>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="px-2 py-1 border rounded-md text-sm"
                  >
                    <option value="NEW">{t("newStatus")}</option>
                    <option value="SHIPPED">{t("shippedStatus")}</option>
                    <option value="DELIVERED">{t("deliveredStatus")}</option>
                    <option value="CANCELLED">{t("cancelledStatus")}</option>
                  </select>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>
                    <Eye className="h-4 w-4 me-1" />
                    {t("orderDetails")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!selected} onOpenChange={(b) => !b && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("orderDetails")}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p>
                <strong>{t("orderNumber")}: </strong>
                #{selected.id.slice(0, 8).toUpperCase()}
              </p>
              <p>
                <strong>{t("customerName")}: </strong>
                {selected.shippingName}
              </p>
              <p>
                <strong>{t("customerPhone")}: </strong>
                {selected.shippingPhone}
              </p>
              <p>
                <strong>{t("city")}: </strong>
                {selected.shippingCity}
              </p>
              <p>
                <strong>{t("addressPlaceholder")}: </strong>
                {selected.shippingAddress}
              </p>
              <div className="border-t pt-2 mt-2">
                {selected.items.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>
                      {i.name} (×{i.quantity})
                    </span>
                    <span>
                      {(i.price * i.quantity).toFixed(2)} {t("currency")}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>{t("deliveryFee")}</span>
                  <span>
                    {selected.deliveryFee.toFixed(2)} {t("currency")}
                  </span>
                </div>
                {selected.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      {t("discount")} ({selected.appliedCouponCode})
                    </span>
                    <span>
                      -{selected.discountAmount.toFixed(2)} {t("currency")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>{t("finalTotal")}</span>
                  <span>
                    {selected.total.toFixed(2)} {t("currency")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
