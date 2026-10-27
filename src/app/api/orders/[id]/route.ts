// Admin: list all orders / Order details by id
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";

// GET /api/orders/[id] - get order details (admin OR owner)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new Error("NOT_FOUND");
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && order.userId !== session.user.id) {
      throw new Error("FORBIDDEN");
    }
    return applySecurityHeaders(NextResponse.json({ order }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
