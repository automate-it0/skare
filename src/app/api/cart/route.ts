// Cart API - authenticated user only
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";

// GET /api/cart - get current user's cart
export async function GET() {
  try {
    const session = await requireUser();
    const items = await db.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return applySecurityHeaders(NextResponse.json({ cart: items }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}

// POST /api/cart - add to cart (productId in body)
export async function POST(req: Request) {
  try {
    const session = await requireUser();
    let body: { productId?: string; quantity?: number };
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const productId = body.productId;
    const qty = Math.max(1, Math.min(99, Number(body.quantity ?? 1) || 1));
    if (!productId) throw new Error("VALIDATION_ERROR");

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("NOT_FOUND");

    const existing = await db.cartItem.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    let item;
    if (existing) {
      item = await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(99, existing.quantity + qty) },
        include: { product: true },
      });
    } else {
      item = await db.cartItem.create({
        data: { userId: session.user.id, productId, quantity: qty },
        include: { product: true },
      });
    }
    return applySecurityHeaders(NextResponse.json({ item }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
