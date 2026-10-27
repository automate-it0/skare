// Admin: update order status
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { orderStatusSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    let body: { status?: string };
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const parsed = orderStatusSchema.safeParse(body.status);
    if (!parsed.success) throw new Error("VALIDATION_ERROR");
    const order = await db.order.update({
      where: { id },
      data: { status: parsed.data },
    });
    await audit({
      userId: session.user.id,
      action: "UPDATE_ORDER_STATUS",
      entity: "Order",
      entityId: id,
      req,
      metadata: { status: parsed.data },
    });
    return applySecurityHeaders(NextResponse.json({ order }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
