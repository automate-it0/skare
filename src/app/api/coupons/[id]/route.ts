// Coupon: update / delete by id
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { couponSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { audit } from "@/lib/audit";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "validation", details: parsed.error.flatten() },
          { status: 422 },
        ),
      );
    }
    const { code, discountPercentage, maxUsers, usesPerUser, isActive, expiresAt } =
      parsed.data;
    const coupon = await db.discountCode.update({
      where: { id },
      data: {
        code,
        discountPercentage,
        maxUsers,
        usesPerUser,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    await audit({
      userId: session.user.id,
      action: "UPDATE_COUPON",
      entity: "Coupon",
      entityId: coupon.id,
      req,
      metadata: { code },
    });
    return applySecurityHeaders(NextResponse.json({ coupon }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    await db.discountCode.delete({ where: { id } });
    await audit({
      userId: session.user.id,
      action: "DELETE_COUPON",
      entity: "Coupon",
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
