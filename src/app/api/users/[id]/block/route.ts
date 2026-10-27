// Admin: block / unblock a user
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { audit } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    let body: { block?: boolean };
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    if (typeof body.block !== "boolean") throw new Error("VALIDATION_ERROR");
    // Prevent self-block and blocking other admins
    if (id === session.user.id) {
      return applySecurityHeaders(
        NextResponse.json({ error: "cannot_block_self" }, { status: 422 }),
      );
    }
    const target = await db.user.findUnique({ where: { id } });
    if (!target) throw new Error("NOT_FOUND");
    if (target.role === "ADMIN") {
      return applySecurityHeaders(
        NextResponse.json({ error: "cannot_block_admin" }, { status: 422 }),
      );
    }
    const updated = await db.user.update({
      where: { id },
      data: { isBlocked: body.block },
      select: { id: true, isBlocked: true },
    });
    await audit({
      userId: session.user.id,
      action: body.block ? "BLOCK_USER" : "UNBLOCK_USER",
      entity: "User",
      entityId: id,
      req,
    });
    return applySecurityHeaders(NextResponse.json({ user: updated }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
