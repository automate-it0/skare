// Admin: list all users
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return applySecurityHeaders(NextResponse.json({ users }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
