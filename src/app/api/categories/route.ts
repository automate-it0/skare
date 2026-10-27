import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { audit } from "@/lib/audit";

// GET /api/categories - public, returns tree
export async function GET() {
  const categories = await db.category.findMany({
    include: { children: true },
    orderBy: { name: "asc" },
  });
  // Build tree
  const roots = categories.filter((c) => !c.parentId);
  const tree = roots.map((r) => ({
    ...r,
    children: categories.filter((c) => c.parentId === r.id),
  }));
  return applySecurityHeaders(NextResponse.json({ categories: tree }));
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "validation", details: parsed.error.flatten() },
          { status: 422 },
        ),
      );
    }
    const { name, parentId } = parsed.data;
    const category = await db.category.create({
      data: { name, parentId: parentId ?? null },
    });
    await audit({
      userId: session.user.id,
      action: "CREATE_CATEGORY",
      entity: "Category",
      entityId: category.id,
      req,
      metadata: { name },
    });
    return applySecurityHeaders(
      NextResponse.json({ category }, { status: 201 }),
    );
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
