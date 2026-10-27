import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { audit } from "@/lib/audit";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    await db.product.delete({ where: { id } });
    await audit({
      userId: session.user.id,
      action: "DELETE_PRODUCT",
      entity: "Product",
      entityId: id,
      req,
    });
    return applySecurityHeaders(NextResponse.json({ ok: true }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
