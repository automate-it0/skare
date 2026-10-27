"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_CITIES } from "@/lib/cities";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    imageUrl?: string | null;
  };
}

export default function CartPage() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    city: "",
    detailedAddress: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const loadCart = () => {
    api
      .get<{ cart: CartItem[] }>("/api/cart")
      .then((r) => setCart(r.cart))
      .catch(() => notify("error", t("orderError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
    // Pre-fill name & phone from profile
    api
      .get<{ user: { fullName: string; phone: string } }>("/api/profile")
      .then((r) => {
        setShipping((s) => ({
          ...s,
          name: r.user.fullName || "",
          phone: r.user.phone || "",
        }));
      })
      .catch(() => {});
  }, []);

  const subtotal = cart.reduce(
    (s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity,
    0,
  );
  const cityFee = DELIVERY_CITIES.find((c) => c.name === shipping.city)?.fee ?? 0;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = subtotal - discount + cityFee;

  const updateQty = async (productId: string, delta: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await removeItem(productId);
      return;
    }
    try {
      await api.put(`/api/cart/${productId}?op=set`, { quantity: newQty });
      setCart((c) =>
        c.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i)),
      );
    } catch (e) {
      notify("error", t("orderError"));
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await api.delete(`/api/cart/${productId}`);
      setCart((c) => c.filter((i) => i.productId !== productId));
    } catch (e) {
      notify("error", t("orderError"));
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const r = await api.post<{ coupon: { code: string; discountAmount: number } }>(
        "/api/coupons/apply",
        { code: couponCode, subtotal },
      );
      setAppliedCoupon(r.coupon);
      notify("success", t("couponApplied"));
    } catch (e) {
      setAppliedCoupon(null);
      if (e instanceof ApiError) {
        if (e.message === "invalid_coupon") notify("error", t("invalidCoupon"));
        else if (e.message === "coupon_total_limit")
          notify("error", t("couponTotalLimitReached"));
        else if (e.message === "coupon_user_limit")
          notify("error", t("couponUserLimitReached"));
        else notify("error", t("invalidCoupon"));
      } else {
        notify("error", t("invalidCoupon"));
      }
    }
  };

  const checkout = async () => {
    if (!shipping.name || !shipping.phone || !shipping.city || !shipping.detailedAddress) {
      notify("error", t("pleaseFillShipping"));
      return;
    }
    if (!/^(010|011|012|015)\d{8}$/.test(shipping.phone)) {
      notify("error", t("invalidPhoneError"));
      return;
    }
    if (cart.length === 0) {
      notify("error", t("emptyCartError"));
      return;
    }
    setPlacing(true);
    try {
      await api.post("/api/orders", {
        shippingName: shipping.name,
        shippingPhone: shipping.phone,
        shippingCity: shipping.city,
        shippingAddress: shipping.detailedAddress,
        couponCode: appliedCoupon?.code ?? null,
      });
      notify("success", t("orderSuccess"));
      router.push("/account");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          notify("error", t("loginToCheckout"));
          router.push("/auth");
          return;
        }
        if (e.status === 429) {
          notify("error", t("rateLimitError"));
          return;
        }
      }
      notify("error", t("orderError"));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 min-h-[calc(100vh-300px)]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{t("cartTitle")}</h1>
      {cart.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t("emptyCart")}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center bg-white p-3 rounded-lg shadow-sm gap-3"
              >
                <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product.imageUrl && (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold truncate">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">
                    {item.product.salePrice ?? item.product.price} {t("currency")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQty(item.productId, -1)}
                    className="px-2"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-8 text-center">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQty(item.productId, 1)}
                    className="px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.productId)}
                  className="text-red-500 hover:bg-red-50 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm space-y-3">
            <h2 className="text-xl font-bold">{t("shippingDetails")}</h2>
            <div>
              <Label htmlFor="ship-name">{t("fullNamePlaceholder")}</Label>
              <Input
                id="ship-name"
                value={shipping.name}
                onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="ship-phone">{t("phonePlaceholder")}</Label>
              <Input
                id="ship-phone"
                type="tel"
                value={shipping.phone}
                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                maxLength={11}
              />
            </div>
            <div>
              <Label htmlFor="ship-city">{t("selectCity")}</Label>
              <Input
                id="ship-city"
                list="cities"
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                placeholder={t("selectCity")}
              />
              <datalist id="cities">
                {DELIVERY_CITIES.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="ship-addr">{t("detailedAddressPlaceholder")}</Label>
              <Textarea
                id="ship-addr"
                value={shipping.detailedAddress}
                onChange={(e) =>
                  setShipping({ ...shipping, detailedAddress: e.target.value })
                }
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="border-t pt-3 space-y-2">
              <h2 className="text-xl font-bold">{t("orderSummary")}</h2>
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span>
                  {subtotal.toFixed(2)} {t("currency")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("deliveryFee")}</span>
                <span>
                  {cityFee.toFixed(2)} {t("currency")}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    {t("discount")} ({appliedCoupon.code})
                  </span>
                  <span>
                    -{discount.toFixed(2)} {t("currency")}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t("finalTotal")}</span>
                <span>
                  {finalTotal.toFixed(2)} {t("currency")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder={t("enterCoupon")}
                maxLength={50}
              />
              <Button variant="secondary" onClick={applyCoupon}>
                {t("applyCoupon")}
              </Button>
            </div>
            <Button
              className="w-full bg-pink-600 hover:bg-pink-700"
              onClick={checkout}
              disabled={placing}
            >
              {placing && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("completeOrder")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
