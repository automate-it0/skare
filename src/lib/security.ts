import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Apply security headers to any response
export function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  return res;
}

/** Safely convert thrown errors to HTTP status + message */
export function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : "SERVER_ERROR";
  switch (msg) {
    case "UNAUTHORIZED":
      return { status: 401, message: "يرجى تسجيل الدخول" };
    case "FORBIDDEN":
      return { status: 403, message: "ليس لديك صلاحية" };
    case "BLOCKED":
      return { status: 403, message: "تم حظر حسابك" };
    case "NOT_FOUND":
      return { status: 404, message: "غير موجود" };
    case "VALIDATION_ERROR":
      return { status: 422, message: "بيانات غير صحيحة" };
    default:
      return { status: 500, message: "خطأ في الخادم" };
  }
}

export type { NextRequest };
