// Apply coupon - validate and return discount preview (does NOT record usage)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    let body: { code?: string; subtotal?: number };
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const code = (body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal ?? 0);
    if (!code || subtotal < 0) throw new Error("VALIDATION_ERROR");

    const coupon = await db.discountCode.findUnique({ where: { code } });
    if (
      !coupon ||
      !coupon.isActive ||
      (coupon.expiresAt && coupon.expiresAt <= new Date())
    ) {
      return applySecurityHeaders(
        NextResponse.json({ error: "invalid_coupon" }, { status: 422 }),
      );
    }
    const totalUses = await db.usedCode.count({ where: { codeId: coupon.id } });
    if (totalUses >= coupon.maxUsers) {
      return applySecurityHeaders(
        NextResponse.json({ error: "coupon_total_limit" }, { status: 422 }),
      );
    }
    const userUses = await db.usedCode.count({
      where: { codeId: coupon.id, userId: session.user.id },
    });
    if (userUses >= coupon.usesPerUser) {
      return applySecurityHeaders(
        NextResponse.json({ error: "coupon_user_limit" }, { status: 422 }),
      );
    }
    const discount = (subtotal * coupon.discountPercentage) / 100;
    return applySecurityHeaders(
      NextResponse.json({
        ok: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountPercentage: coupon.discountPercentage,
          discountAmount: discount,
        },
      }),
    );
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
