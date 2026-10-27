import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Session } from "next-auth";

export type AppSession = Session & {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  };
};

export async function getSession(): Promise<AppSession | null> {
  return (await getServerSession(authOptions)) as AppSession | null;
}

export async function requireUser() {
  const s = await getSession();
  if (!s?.user?.id) throw new Error("UNAUTHORIZED");
  // Re-check block status from DB (defense in depth)
  const u = await db.user.findUnique({
    where: { id: s.user.id },
    select: { isBlocked: true, role: true },
  });
  if (!u || u.isBlocked) throw new Error("FORBIDDEN");
  return { ...s, user: { ...s.user, role: u.role } };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return s;
}
