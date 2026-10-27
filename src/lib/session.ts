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

/**
 * A session whose user is guaranteed to be present and identified.
 *
 * `requireUser()` throws unless `user.id` exists, so the id is non-optional
 * in the returned shape. Spreading `AppSession["user"]` would keep the
 * optional `id?: string` and force every caller to re-assert it, so the id
 * is narrowed explicitly here instead.
 */
export type AuthenticatedSession = Omit<AppSession, "user"> & {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  };
};

export async function requireUser(): Promise<AuthenticatedSession> {
  const s = await getSession();
  if (!s?.user?.id) throw new Error("UNAUTHORIZED");
  const userId = s.user.id;
  // Re-check block status from DB (defense in depth)
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { isBlocked: true, role: true },
  });
  if (!u || u.isBlocked) throw new Error("FORBIDDEN");
  return { ...s, user: { ...s.user, id: userId, role: u.role } };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return s;
}
