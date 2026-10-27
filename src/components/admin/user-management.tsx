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
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
}

export function UserManagement() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get<{ users: User[] }>("/api/users")
      .then((r) => setUsers(r.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (u: User) => {
    try {
      await api.patch(`/api/users/${u.id}/block`, { block: !u.isBlocked });
      notify("success", t("save"));
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
      <h2 className="text-2xl font-bold mb-4">{t("manageUsers")}</h2>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("userEmail")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.fullName || "N/A"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell dir="ltr">{u.phone || "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={u.isBlocked ? "destructive" : "default"}
                    className={
                      u.isBlocked
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {u.isBlocked ? t("blocked") : t("active")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.role === "ADMIN" ? (
                    <span className="text-xs text-gray-400">ADMIN</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={u.isBlocked ? "default" : "destructive"}
                      onClick={() => toggleBlock(u)}
                      className={
                        u.isBlocked
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-500 hover:bg-red-600"
                      }
                    >
                      {u.isBlocked ? t("unblock") : t("block")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
