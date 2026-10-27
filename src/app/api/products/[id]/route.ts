import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "validation", details: parsed.error.flatten() },
          { status: 422 },
        ),
      );
    }
    const { name, description, price, salePrice, imageUrl, categoryId } =
      parsed.data;
    const product = await db.product.create({
      data: {
        name,
        description,
        price,
        salePrice: salePrice ?? null,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
      },
    });
    await audit({
      userId: session.user.id,
      action: "CREATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      req,
      metadata: { name },
    });
    return applySecurityHeaders(
      NextResponse.json({ product }, { status: 201 }),
    );
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) throw new Error("VALIDATION_ERROR");
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "validation", details: parsed.error.flatten() },
          { status: 422 },
        ),
      );
    }
    const { name, description, price, salePrice, imageUrl, categoryId } =
      parsed.data;
    const product = await db.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        salePrice: salePrice ?? null,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
      },
    });
    await audit({
      userId: session.user.id,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      req,
      metadata: { name },
    });
    return applySecurityHeaders(NextResponse.json({ product }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
