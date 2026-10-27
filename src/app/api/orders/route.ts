// Order placement & user order history
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { orderSchema } from "@/lib/validation";
import { DELIVERY_CITIES } from "@/lib/cities";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

// GET /api/orders - current user's orders
export async function GET() {
  try {
    const session = await requireUser();
    const orders = await db.order.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return applySecurityHeaders(NextResponse.json({ orders }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}

// POST /api/orders - place a new order
export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const ip = getClientIP(req);
    const rl = rateLimit(`order:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return applySecurityHeaders(
        NextResponse.json({ error: "rate_limit" }, { status: 429 }),
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "validation", details: parsed.error.flatten() },
          { status: 422 },
        ),
      );
    }
    const { shippingName, shippingPhone, shippingCity, shippingAddress, couponCode } =
      parsed.data;

    const city = DELIVERY_CITIES.find((c) => c.name === shippingCity);
    if (!city) throw new Error("VALIDATION_ERROR");

    // Load cart with products
    const cart = await db.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    });
    if (cart.length === 0) throw new Error("VALIDATION_ERROR");

    // Calculate subtotal (server-side authoritative)
    const subtotal = cart.reduce(
      (s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity,
      0,
    );

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const code = await db.discountCode.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (code && code.isActive && (!code.expiresAt || code.expiresAt > new Date())) {
        const totalUses = await db.usedCode.count({ where: { codeId: code.id } });
        if (totalUses < code.maxUsers) {
          const userUses = await db.usedCode.count({
            where: { codeId: code.id, userId: session.user.id },
          });
          if (userUses < code.usesPerUser) {
            discountAmount = (subtotal * code.discountPercentage) / 100;
            appliedCouponId = code.id;
            appliedCouponCode = code.code;
          }
        }
      }
    }

    const total = subtotal - discountAmount + city.fee;

    // Create order in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          status: "NEW",
          shippingName,
          shippingPhone,
          shippingCity: shippingCity,
          shippingAddress,
          deliveryFee: city.fee,
          appliedCouponCode,
          discountAmount,
          items: {
            create: cart.map((i) => ({
              productId: i.productId,
              name: i.product.name,
              quantity: i.quantity,
              price: i.product.salePrice ?? i.product.price,
            })),
          },
        },
        include: { items: true },
      });
      if (appliedCouponId) {
        await tx.usedCode.create({
          data: {
            codeId: appliedCouponId,
            userId: session.user.id,
            orderId: newOrder.id,
          },
        });
      }
      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: session.user.id } });
      return newOrder;
    });

    return applySecurityHeaders(
      NextResponse.json({ order }, { status: 201 }),
    );
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
