"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
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

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  children?: Category[];
}

export function CategoryManagement() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", parentId: "" });

  const load = () => {
    api
      .get<{ categories: Category[] }>("/api/categories")
      .then((r) => setCategories(r.categories))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", parentId: "" });
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, parentId: c.parentId ?? "" });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, parentId: form.parentId || null };
      if (editing) {
        await api.put(`/api/categories/${editing.id}`, payload);
      } else {
        await api.post("/api/categories", payload);
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
      await api.delete(`/api/categories/${id}`);
      notify("success", t("delete"));
      load();
    } catch {
      notify("error", t("orderError"));
    }
  };

  const renderRow = (c: Category, level: number = 0): React.ReactNode => (
    <>
      <TableRow key={c.id}>
        <TableCell style={{ paddingInlineStart: `${level * 24 + 16}px` }}>
          {level > 0 && "— "}
          {c.name}
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
      {c.children?.map((child) => renderRow(child, level + 1))}
    </>
  );

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
        <h2 className="text-2xl font-bold">{t("manageCategories")}</h2>
        <Button onClick={openNew} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 me-1" />
          {t("addCategory")}
        </Button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("categoryName")}</TableHead>
              <TableHead>{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{categories.map((c) => renderRow(c))}</TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("addCategory")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div>
              <Label htmlFor="cat-name">{t("categoryName")}</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div>
              <Label htmlFor="cat-parent">{t("parentCategory")}</Label>
              <select
                id="cat-parent"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">{t("selectParentCategory")}</option>
                {categories
                  .filter((c) => !c.parentId && c.id !== editing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
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
