// Coupon CRUD (admin) + apply (customer)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { couponSchema } from "@/lib/validation";
import { requireAdmin, requireUser } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { audit } from "@/lib/audit";

// GET - admin list all coupons
export async function GET() {
  try {
    await requireAdmin();
    const coupons = await db.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return applySecurityHeaders(NextResponse.json({ coupons }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}

// POST - admin create coupon
export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
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
    const coupon = await db.discountCode.create({
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
      action: "CREATE_COUPON",
      entity: "Coupon",
      entityId: coupon.id,
      req,
      metadata: { code },
    });
    return applySecurityHeaders(
      NextResponse.json({ coupon }, { status: 201 }),
    );
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
