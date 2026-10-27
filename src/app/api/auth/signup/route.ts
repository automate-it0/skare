import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { applySecurityHeaders } from "@/lib/security";

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const rl = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return applySecurityHeaders(
      NextResponse.json({ error: "rate_limit" }, { status: 429 }),
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return applySecurityHeaders(
      NextResponse.json({ error: "invalid_json" }, { status: 400 }),
    );
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: "validation", details: parsed.error.flatten() },
        { status: 422 },
      ),
    );
  }
  const { email, password, fullName, phone, address } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return applySecurityHeaders(
      NextResponse.json({ error: "user_exists" }, { status: 409 }),
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email, passwordHash, fullName, phone, address, role: "CUSTOMER" },
    select: { id: true, email: true, role: true },
  });

  return applySecurityHeaders(
    NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email } },
      { status: 201 },
    ),
  );
}
