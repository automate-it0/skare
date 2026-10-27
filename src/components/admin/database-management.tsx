"use client";
import { useEffect, useState, useRef } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import {
  Database,
  Download,
  Upload,
  Trash2,
  Loader2,
  Users,
  Package,
  ShoppingCart,
  Ticket,
  ShieldAlert,
} from "lucide-react";

interface Stats {
  counts: {
    users: number;
    admins: number;
    blockedUsers: number;
    products: number;
    categories: number;
    orders: number;
    coupons: number;
    cartItems: number;
    auditLogs: number;
  };
  ordersByStatus: Record<string, number>;
}

export function DatabaseManagement() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api
      .get<Stats>("/api/db/stats")
      .then((r) => setStats(r))
      .catch(() => notify("error", "فشل تحميل الإحصائيات"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onExport = async () => {
    setExporting(true);
    try {
      // Trigger browser download
      const a = document.createElement("a");
      a.href = "/api/db/export";
      a.download = `skare-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      notify("success", "تم تصدير قاعدة البيانات");
    } catch {
      notify("error", "فشل التصدير");
    } finally {
      setExporting(false);
    }
  };

  const onImport = async () => {
    if (!importFile) {
      notify("error", "اختر ملف JSON أولاً");
      return;
    }
    setImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text); // validate JSON
      const r = await api.post(
        `/api/db/import?mode=${importMode}`,
        data,
      );
      notify("success", `تم استيراد: ${r.imported.products} منتج، ${r.imported.categories} قسم، ${r.imported.coupons} كوبون`);
      load();
    } catch (e) {
      if (e instanceof SyntaxError) {
        notify("error", "ملف JSON غير صالح");
      } else if (e instanceof ApiError) {
        notify("error", `فشل الاستيراد: ${e.message}`);
      } else {
        notify("error", "فشل الاستيراد");
      }
    } finally {
      setImporting(false);
      setImportFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onReset = async () => {
    if (resetConfirmText !== "RESET") {
      notify("error", 'اكتب "RESET" للتأكيد');
      return;
    }
    try {
      await api.post("/api/db/reset?confirm=yes-really", {});
      notify("success", "تم إعادة تعيين قاعدة البيانات");
      setResetOpen(false);
      setResetConfirmText("");
      load();
    } catch {
      notify("error", "فشلت إعادة التعيين");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }
  if (!stats) return null;

  const cards = [
    { label: "المستخدمون", value: stats.counts.users, icon: Users, color: "text-blue-600" },
    { label: "الأدمن", value: stats.counts.admins, icon: ShieldAlert, color: "text-purple-600" },
    { label: "المنتجات", value: stats.counts.products, icon: Package, color: "text-pink-600" },
    { label: "الأقسام", value: stats.counts.categories, icon: Package, color: "text-indigo-600" },
    { label: "الطلبات", value: stats.counts.orders, icon: ShoppingCart, color: "text-green-600" },
    { label: "الكوبونات", value: stats.counts.coupons, icon: Ticket, color: "text-amber-600" },
    { label: "سجلات التدقيق", value: stats.counts.auditLogs, icon: Database, color: "text-gray-600" },
    { label: "محظورون", value: stats.counts.blockedUsers, icon: ShieldAlert, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">إدارة قاعدة البيانات</h2>
        <p className="text-sm text-gray-500">
          قاعدة بيانات SQLite محلية — لا تحتاج أي حساب cloud. النسخ الاحتياطي يُحفظ كملف JSON على جهازك.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <c.icon className={`h-8 w-8 ${c.color}`} />
              <div>
                <p className="text-2xl font-extrabold">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders by status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الطلبات حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.ordersByStatus).length === 0 && (
              <p className="text-sm text-gray-400">لا توجد طلبات</p>
            )}
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div
                key={status}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
              >
                <span className="font-semibold">{status}</span>: {count}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            تصدير نسخة احتياطية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            يُنزّل ملف JSON يحتوي على كل المنتجات والأقسام والمستخدمين والطلبات والكوبونات (بدون كلمات المرور).
          </p>
          <Button onClick={onExport} disabled={exporting} className="bg-green-600 hover:bg-green-700">
            {exporting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Download className="h-4 w-4 me-2" />}
            تصدير الآن
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            استيراد من نسخة احتياطية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            اختر ملف JSON تم تصديره مسبقاً. اختر الوضع:
          </p>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={importMode === "merge"}
                onChange={() => setImportMode("merge")}
              />
              <span><b>دمج</b> (إضافة/تحديث — آمن)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={importMode === "replace"}
                onChange={() => setImportMode("replace")}
              />
              <span><b>استبدال</b> (يمسح الكل ثم يستورد — خطر)</span>
            </label>
          </div>
          <div>
            <Label htmlFor="db-import-file">ملف JSON</Label>
            <Input
              id="db-import-file"
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button onClick={onImport} disabled={importing || !importFile} className="bg-blue-600 hover:bg-blue-700">
            {importing ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />}
            استيراد
          </Button>
        </CardContent>
      </Card>

      {/* Reset (danger) */}
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            منطقة الخطر — إعادة تعيين
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-700">
            يحذف كل المنتجات والأقسام والطلبات والكوبونات والعملاء (لا يحذف حسابات الأدمن). لا يمكن التراجع!
          </p>
          <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 me-2" />
                إعادة تعيين قاعدة البيانات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد إعادة التعيين</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف جميع البيانات نهائياً (ماعدا حسابات الأدمن). للتأكيد اكتب <b>RESET</b>:
                  <Input
                    className="mt-3"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="RESET"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setResetConfirmText("")}>
                  إلغاء
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onReset}
                  disabled={resetConfirmText !== "RESET"}
                  className="bg-red-600 hover:bg-red-700"
                >
                  نعم، احذف كل شيء
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
