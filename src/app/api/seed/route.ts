// Seed endpoint - creates admin user + sample data (idempotent)
// Admin password is read from ADMIN_PASSWORD env var (or auto-generated if missing)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { applySecurityHeaders } from "@/lib/security";
import { randomBytes } from "crypto";

export async function POST() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const existing = await db.user.findUnique({ where: { email: adminEmail } });

  // Generate a random password if ADMIN_PASSWORD env is not set
  // (in dev: you can set ADMIN_PASSWORD in .env to a known value)
  const adminPassword =
    process.env.ADMIN_PASSWORD || randomBytes(8).toString("hex");

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: "Skare Admin",
        phone: "01000000000",
        address: "Admin Address",
        role: "ADMIN",
      },
    });
  }

  // Seed categories if none
  const catCount = await db.category.count();
  if (catCount === 0) {
    const skin = await db.category.create({ data: { name: "العناية بالبشرة" } });
    await db.category.create({ data: { name: "كريمات", parentId: skin.id } });
    await db.category.create({ data: { name: "غسول", parentId: skin.id } });
    const hair = await db.category.create({ data: { name: "العناية بالشعر" } });
    await db.category.create({ data: { name: "شامبو", parentId: hair.id } });
    const makeup = await db.category.create({ data: { name: "مكياج" } });
    await db.category.create({ data: { name: "أحمر شفاه", parentId: makeup.id } });

    // Sample products
    await db.product.createMany({
      data: [
        {
          name: "كريم مرطب فاخر",
          description: "كريم مرطب للبشرة بمكونات طبيعية فاخرة.",
          price: 250,
          salePrice: 199,
          imageUrl:
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
          categoryId: skin.id,
        },
        {
          name: "غسول وجه بالورد",
          description: "غسول لطيف ينظف البشرة بعمق.",
          price: 120,
          imageUrl:
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
          categoryId: skin.id,
        },
        {
          name: "شامبو الشعر الكيراتين",
          description: "شامبو يغذي الشعر بالكيراتين.",
          price: 180,
          imageUrl:
            "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600",
          categoryId: hair.id,
        },
        {
          name: "أحمر شفاه مخملي",
          description: "أحمر شفاه يدوم طويلاً بملمس مخملي.",
          price: 95,
          salePrice: 75,
          imageUrl:
            "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600",
          categoryId: makeup.id,
        },
      ],
    });

    // Sample coupon
    await db.discountCode.create({
      data: {
        code: "WELCOME10",
        discountPercentage: 10,
        maxUsers: 100,
        usesPerUser: 1,
        isActive: true,
      },
    });
  }

  return applySecurityHeaders(
    NextResponse.json({
      ok: true,
      adminEmail,
      // Only return password if it was auto-generated (first run)
      // User must change it immediately via sign-in + profile update
      ...(adminPassword && !process.env.ADMIN_PASSWORD
        ? { generatedAdminPassword: adminPassword, warning: "Change this immediately after first login" }
        : {}),
    }),
  );
}
