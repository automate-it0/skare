"use client";
import { useSession, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  return {
    session,
    status,
    isAdmin,
    isAuthenticated: status === "authenticated",
    signOut: () => signOut({ callbackUrl: "/" }),
  };
}
