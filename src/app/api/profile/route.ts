// Profile - get/update current user's profile
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, applySecurityHeaders } from "@/lib/security";
import { nameSchema, phoneSchema, addressSchema } from "@/lib/validation";
import { z } from "zod";

const profileSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  address: addressSchema,
});

export async function GET() {
  try {
    const session = await requireUser();
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new Error("NOT_FOUND");
    return applySecurityHeaders(NextResponse.json({ user }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireUser();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("VALIDATION_ERROR");
    }
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "validation", details: parsed.error.flatten() },
          { status: 422 },
        ),
      );
    }
    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        address: parsed.data.address,
      },
      select: { id: true, fullName: true, phone: true, address: true },
    });
    return applySecurityHeaders(NextResponse.json({ user }));
  } catch (e) {
    const { status, message } = handleError(e);
    return applySecurityHeaders(
      NextResponse.json({ error: message }, { status }),
    );
  }
}
