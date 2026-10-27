// Cart item manipulation by product id
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";

// PUT /api/cart/[productId]?op=inc|dec|set&quantity=N
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await requireUser();
    const { productId } = await params;
    const url = new URL(req.url);
    const op = url.searchParams.get("op") ?? "set";
    let body: { quantity?: number } = {};
    try {
      body = await req.json();
    } catch {
      // ignore - body optional
    }
    const requestedQty = Number(body.quantity ?? 1);

    const existing = await db.cartItem.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    if (!existing) {
      // For "set" with qty >=1, create
      if (op === "set" && requestedQty >= 1) {
        const item = await db.cartItem.create({
          data: { userId: session.user.id, productId, quantity: Math.min(99, requestedQty) },
          include: { product: true },
        });
        return applySecurityHeaders(NextResponse.json({ item }));
      }
      return applySecurityHeaders(
        NextResponse.json({ error: "not_found" }, { status: 404 }),
      );
    }
    let newQty = existing.quantity;
    if (op === "inc") newQty += 1;
    else if (op === "dec") newQty -= 1;
    else newQty = requestedQty;
    newQty = Math.max(0, Math.min(99, newQty));

    if (newQty === 0) {
      await db.cartItem.delete({ where: { id: existing.id } });
      return applySecurityHeaders(NextResponse.json({ ok: true, removed: true }));
    }
    const item = await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
      include: { product: true },
    });
    return applySecurityHeaders(NextResponse.json({ item }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await requireUser();
    const { productId } = await params;
    await db.cartItem.deleteMany({
      where: { userId: session.user.id, productId },
    });
    return applySecurityHeaders(NextResponse.json({ ok: true }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
