// Analytics dashboard data (admin only)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";

export async function GET() {
  try {
    await requireAdmin();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await db.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: { items: true },
    });

    const totalSales = orders.reduce((s, o) => s + o.total, 0);

    // Most/least sold products
    const productSales = new Map<string, number>();
    orders.forEach((o) =>
      o.items.forEach((i) => {
        productSales.set(i.productId, (productSales.get(i.productId) ?? 0) + i.quantity);
      }),
    );
    const sorted = [...productSales.entries()].sort(([, a], [, b]) => b - a);
    const productIds = sorted.map(([id]) => id);
    const products = productIds.length
      ? await db.product.findMany({ where: { id: { in: productIds } } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));
    const mostSold = sorted.slice(0, 5).map(([id, q]) => ({
      ...productMap.get(id),
      quantity: q,
    }));
    const leastSold = sorted.slice(-5).reverse().map(([id, q]) => ({
      ...productMap.get(id),
      quantity: q,
    }));

    // Top customers
    const customerSales = new Map<string, number>();
    orders.forEach((o) => {
      customerSales.set(o.userId, (customerSales.get(o.userId) ?? 0) + o.total);
    });
    const topCustomerIds = [...customerSales.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);
    const topCustomersData = topCustomerIds.length
      ? await db.user.findMany({
          where: { id: { in: topCustomerIds } },
          select: { id: true, email: true, fullName: true },
        })
      : [];
    const topCustomers = topCustomerIds.map((id) => ({
      ...topCustomersData.find((u) => u.id === id),
      total: customerSales.get(id),
    }));

    // Sales by category
    const categories = await db.category.findMany();
    const categorySales = categories.map((c) => ({ name: c.name, total: 0 }));
    orders.forEach((o) =>
      o.items.forEach((i) => {
        const p = productMap.get(i.productId);
        if (!p?.categoryId) return;
        const c = categories.find((cat) => cat.id === p.categoryId);
        if (!c) return;
        const idx = categorySales.findIndex((cs) => cs.name === c.name);
        if (idx >= 0) categorySales[idx].total += i.price * i.quantity;
      }),
    );

    return applySecurityHeaders(
      NextResponse.json({
        totalSales,
        mostSold,
        leastSold,
        topCustomers,
        categorySales,
      }),
    );
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
