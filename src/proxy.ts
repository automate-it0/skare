import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// Global proxy (formerly middleware): security headers + global rate limit
export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Security headers
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-Download-Options", "noopen");

  // Global rate limit per IP - generous: 200 req/min
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = rateLimit(`global:${ip}`, 200, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limit" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|logo.svg).*)"],
};
