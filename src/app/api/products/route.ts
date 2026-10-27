import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applySecurityHeaders } from "@/lib/security";

// GET /api/products - public, with optional search & category filter
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const categoryId = url.searchParams.get("categoryId");

  const products = await db.product.findMany({
    where: {
      AND: [
        q ? { name: { contains: q } } : {},
        categoryId ? { categoryId } : {},
      ],
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return applySecurityHeaders(NextResponse.json({ products }));
}
