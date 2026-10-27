// Audit log helper - records admin actions for accountability
import { db } from "@/lib/db";

export async function audit(opts: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  req?: Request;
  metadata?: Record<string, unknown>;
}) {
  try {
    const ip = opts.req
      ? opts.req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null
      : null;
    const userAgent = opts.req?.headers.get("user-agent") ?? null;
    await db.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        ip,
        userAgent,
        metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      },
    });
  } catch {
    // Don't let audit failure break the request
  }
}
