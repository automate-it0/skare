"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  maxUsers: number;
  usesPerUser: number;
  isActive: boolean;
}

export function CouponManagement() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountPercentage: "10",
    maxUsers: "100",
    usesPerUser: "1",
    isActive: true,
  });

  const load = () => {
    api
      .get<{ coupons: Coupon[] }>("/api/coupons")
      .then((r) => setCoupons(r.coupons))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", discountPercentage: "10", maxUsers: "100", usesPerUser: "1", isActive: true });
    setOpen(true);
  };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountPercentage: String(c.discountPercentage),
      maxUsers: String(c.maxUsers),
      usesPerUser: String(c.usesPerUser),
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountPercentage: parseInt(form.discountPercentage, 10),
        maxUsers: parseInt(form.maxUsers, 10),
        usesPerUser: parseInt(form.usesPerUser, 10),
        isActive: form.isActive,
        expiresAt: null,
      };
      if (editing) {
        await api.put(`/api/coupons/${editing.id}`, payload);
      } else {
        await api.post("/api/coupons", payload);
      }
      notify("success", t("save"));
      setOpen(false);
      load();
    } catch {
      notify("error", t("orderError"));
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await api.delete(`/api/coupons/${id}`);
      notify("success", t("delete"));
      load();
    } catch {
      notify("error", t("orderError"));
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await api.put(`/api/coupons/${c.id}`, {
        code: c.code,
        discountPercentage: c.discountPercentage,
        maxUsers: c.maxUsers,
        usesPerUser: c.usesPerUser,
        isActive: !c.isActive,
        expiresAt: null,
      });
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t("manageCoupons")}</h2>
        <Button onClick={openNew} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 me-1" />
          {t("addCoupon")}
        </Button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("couponCode")}</TableHead>
              <TableHead>{t("discountPercentage")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.code}</TableCell>
                <TableCell>{c.discountPercentage}%</TableCell>
                <TableCell>
                  <Switch checked={c.isActive} onCheckedChange={() => toggleActive(c)} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => del(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("addCoupon")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div>
              <Label htmlFor="cp-code">{t("couponCode")}</Label>
              <Input
                id="cp-code"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                pattern="^[A-Z0-9_-]{3,50}$"
                maxLength={50}
                required
              />
            </div>
            <div>
              <Label htmlFor="cp-disc">{t("discountPercentage")}</Label>
              <Input
                id="cp-disc"
                type="number"
                min={1}
                max={100}
                value={form.discountPercentage}
                onChange={(e) =>
                  setForm({ ...form, discountPercentage: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cp-max">{t("maxUsers")}</Label>
                <Input
                  id="cp-max"
                  type="number"
                  min={1}
                  value={form.maxUsers}
                  onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cp-per">{t("usesPerUser")}</Label>
                <Input
                  id="cp-per"
                  type="number"
                  min={1}
                  value={form.usesPerUser}
                  onChange={(e) =>
                    setForm({ ...form, usesPerUser: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving} className="bg-pink-600 hover:bg-pink-700">
                {saving && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
