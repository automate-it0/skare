"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { ProductManagement } from "@/components/admin/product-management";
import { CategoryManagement } from "@/components/admin/category-management";
import { UserManagement } from "@/components/admin/user-management";
import { OrderManagement } from "@/components/admin/order-management";
import { CouponManagement } from "@/components/admin/coupon-management";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { DatabaseManagement } from "@/components/admin/database-management";

type Tab = "orders" | "analytics" | "products" | "categories" | "users" | "coupons" | "database";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { lang } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
    else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  if (status !== "authenticated" || (session?.user as any)?.role !== "ADMIN") {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "orders", label: t("orders") },
    { id: "analytics", label: t("analytics") },
    { id: "products", label: t("products") },
    { id: "categories", label: t("categories") },
    { id: "users", label: t("users") },
    { id: "coupons", label: t("coupons") },
    { id: "database", label: "قاعدة البيانات" },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">{t("adminPanel")}</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-1/5">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tabItem) => (
              <Button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                variant={tab === tabItem.id ? "default" : "outline"}
                className={
                  tab === tabItem.id
                    ? "bg-pink-600 text-white justify-start"
                    : "justify-start"
                }
              >
                {tabItem.label}
              </Button>
            ))}
          </nav>
        </aside>
        <main className="flex-grow md:w-4/5 min-w-0">
          {tab === "orders" && <OrderManagement />}
          {tab === "analytics" && <AnalyticsDashboard />}
          {tab === "products" && <ProductManagement />}
          {tab === "categories" && <CategoryManagement />}
          {tab === "users" && <UserManagement />}
          {tab === "coupons" && <CouponManagement />}
          {tab === "database" && <DatabaseManagement />}
        </main>
      </div>
    </div>
  );
}
