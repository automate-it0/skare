// Admin: list all orders (with optional status filter)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const orders = await db.order.findMany({
      where: status ? { status } : {},
      include: { items: true, user: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return applySecurityHeaders(NextResponse.json({ orders }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
