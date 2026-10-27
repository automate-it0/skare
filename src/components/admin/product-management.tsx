"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Plus, Trash2, Loader2, Upload } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  categoryId?: string | null;
}

interface Category {
  id: string;
  name: string;
}

export function ProductManagement() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    salePrice: "",
    imageUrl: "",
    categoryId: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = () => {
    Promise.all([
      api.get<{ products: Product[] }>("/api/products"),
      api.get<{ categories: Category[] }>("/api/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p.products);
        setCategories(c.categories);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", salePrice: "", imageUrl: "", categoryId: "" });
    setImageFile(null);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : "",
      imageUrl: p.imageUrl ?? "",
      categoryId: p.categoryId ?? "",
    });
    setImageFile(null);
    setOpen(true);
  };

  const onUpload = async () => {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append("file", imageFile);
    const r = await api.upload<{ url: string }>("/api/upload", fd);
    return r.url;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let url = form.imageUrl;
      if (imageFile) url = (await onUpload()) ?? url;
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        imageUrl: url,
        categoryId: form.categoryId || null,
      };
      if (editing) {
        await api.put(`/api/products?id=${editing.id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      notify("success", t("save"));
      setOpen(false);
      load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        notify("error", "ليس لديك صلاحية");
      } else {
        notify("error", t("orderError"));
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await api.delete(`/api/products/${id}/delete`);
      notify("success", t("delete"));
      load();
    } catch (e) {
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
        <h2 className="text-2xl font-bold">{t("manageProducts")}</h2>
        <Button onClick={openNew} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 me-1" />
          {t("addProduct")}
        </Button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("productName")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>
                  {p.price} {t("currency")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => del(p.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("addProduct")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div>
              <Label htmlFor="prod-image">{t("uploadImage")}</Label>
              <Input
                id="prod-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {form.imageUrl && !imageFile && (
                <p className="text-xs text-gray-500 mt-1">
                  صورة حالية موجودة. اختر ملفًا جديدًا لتغييرها.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="prod-name">{t("productName")}</Label>
              <Input
                id="prod-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={200}
                required
              />
            </div>
            <div>
              <Label htmlFor="prod-desc">{t("productDesc")}</Label>
              <Textarea
                id="prod-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                maxLength={5000}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="prod-price">{t("price")}</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="prod-sale">{t("salePrice")}</Label>
                <Input
                  id="prod-sale"
                  type="number"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prod-cat">{t("category")}</Label>
              <select
                id="prod-cat"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">{t("category")}</option>
                {categories.map((c) => (
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
