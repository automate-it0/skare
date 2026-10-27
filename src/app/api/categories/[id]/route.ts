import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validation";
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
    // Prevent making category its own parent
    if (parentId === id) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "invalid_parent" },
          { status: 422 },
        ),
      );
    }
    const category = await db.category.update({
      where: { id },
      data: { name, parentId: parentId ?? null },
    });
    await audit({
      userId: session.user.id,
      action: "UPDATE_CATEGORY",
      entity: "Category",
      entityId: category.id,
      req,
      metadata: { name },
    });
    return applySecurityHeaders(NextResponse.json({ category }));
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
    await db.category.delete({ where: { id } });
    await audit({
      userId: session.user.id,
      action: "DELETE_CATEGORY",
      entity: "Category",
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
