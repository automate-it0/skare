#!/usr/bin/env node
/**
 * Skare Store - CLI Backup Tool
 * Usage:
 *   node scripts/backup.cjs export > backup.json     # export to stdout
 *   node scripts/backup.cjs import backup.json        # import from file (merge mode)
 *   node scripts/backup.cjs import backup.json replace # import (replace mode)
 *   node scripts/backup.cjs stats                      # print DB stats
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const db = new PrismaClient();

async function exportDb() {
  const [users, categories, products, coupons, orders, usedCodes, auditLogs] =
    await Promise.all([
      db.user.findMany({
        select: {
          id: true, email: true, fullName: true, phone: true, address: true,
          role: true, isBlocked: true, createdAt: true, updatedAt: true,
        },
      }),
      db.category.findMany(),
      db.product.findMany(),
      db.discountCode.findMany(),
      db.order.findMany({ include: { items: true } }),
      db.usedCode.findMany(),
      db.auditLog.findMany(),
    ]);
  console.log(JSON.stringify({
    _meta: {
      exportedAt: new Date().toISOString(),
      app: "Skare Store",
      version: 1,
      counts: {
        users: users.length, categories: categories.length,
        products: products.length, coupons: coupons.length,
        orders: orders.length, usedCodes: usedCodes.length,
        auditLogs: auditLogs.length,
      },
    },
    users, categories, products, coupons, orders, usedCodes, auditLogs,
  }, null, 2));
}

async function importDb(file, mode = "merge") {
  const raw = fs.readFileSync(file, "utf8");
  const dump = JSON.parse(raw);
  console.log(`Importing ${file} (mode: ${mode})...`);
  console.log(`  Backup contains: ${dump.products?.length ?? 0} products, ${dump.categories?.length ?? 0} categories, ${dump.coupons?.length ?? 0} coupons, ${dump.users?.length ?? 0} users`);

  const result = await db.$transaction(async (tx) => {
    const counts = { users: 0, categories: 0, products: 0, coupons: 0 };
    if (mode === "replace") {
      await tx.usedCode.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();
      await tx.cartItem.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.product.deleteMany();
      await tx.discountCode.deleteMany();
      await tx.category.deleteMany();
      await tx.user.deleteMany({ where: { role: "CUSTOMER" } });
    }
    const existingAdminEmails = new Set(
      (await tx.user.findMany({ where: { role: "ADMIN" }, select: { email: true } })).map(u => u.email)
    );
    for (const u of dump.users ?? []) {
      if (u.role === "ADMIN" && existingAdminEmails.has(u.email)) continue;
      const passwordHash = u.passwordHash ?? await bcrypt.hash("changeme12345", 12);
      await tx.user.upsert({
        where: { email: u.email },
        create: { email: u.email, passwordHash, fullName: u.fullName, phone: u.phone, address: u.address, role: u.role ?? "CUSTOMER", isBlocked: u.isBlocked ?? false },
        update: { fullName: u.fullName, phone: u.phone, address: u.address, isBlocked: u.isBlocked ?? false },
      });
      counts.users++;
    }
    const validCatIds = new Set((dump.categories ?? []).filter(c => c.id).map(c => c.id));
    for (const c of dump.categories ?? []) {
      const parentId = c.parentId && validCatIds.has(c.parentId) ? c.parentId : null;
      if (c.id) {
        await tx.category.upsert({ where: { id: c.id }, create: { id: c.id, name: c.name, parentId }, update: { name: c.name, parentId } });
      } else {
        await tx.category.create({ data: { name: c.name, parentId } });
      }
      counts.categories++;
    }
    const dbCats = await tx.category.findMany({ select: { id: true } });
    const dbCatIds = new Set(dbCats.map(c => c.id));
    for (const p of dump.products ?? []) {
      const categoryId = p.categoryId && dbCatIds.has(p.categoryId) ? p.categoryId : null;
      const data = { name: p.name, description: p.description, price: Number(p.price), salePrice: p.salePrice != null ? Number(p.salePrice) : null, imageUrl: p.imageUrl, categoryId };
      if (p.id && await tx.product.findUnique({ where: { id: p.id } })) {
        await tx.product.update({ where: { id: p.id }, data });
      } else {
        await tx.product.create({ data });
      }
      counts.products++;
    }
    for (const c of dump.coupons ?? []) {
      const data = { code: c.code.toUpperCase(), discountPercentage: Number(c.discountPercentage), maxUsers: Number(c.maxUsers), usesPerUser: Number(c.usesPerUser), isActive: !!c.isActive, expiresAt: c.expiresAt ? new Date(c.expiresAt) : null };
      await tx.discountCode.upsert({ where: { code: data.code }, create: data, update: data });
      counts.coupons++;
    }
    return counts;
  });
  console.log(`✓ Done. Imported: ${result.users} users, ${result.categories} categories, ${result.products} products, ${result.coupons} coupons`);
}

async function stats() {
  const counts = {
    users: await db.user.count(),
    admins: await db.user.count({ where: { role: "ADMIN" } }),
    blocked: await db.user.count({ where: { isBlocked: true } }),
    products: await db.product.count(),
    categories: await db.category.count(),
    orders: await db.order.count(),
    coupons: await db.discountCode.count(),
    cartItems: await db.cartItem.count(),
    auditLogs: await db.auditLog.count(),
  };
  console.log("=== Skare DB Stats ===");
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === "export") await exportDb();
    else if (cmd === "import") await importDb(args[0], args[1] || "merge");
    else if (cmd === "stats") await stats();
    else {
      console.log("Usage:");
      console.log("  node scripts/backup.cjs export > backup.json");
      console.log("  node scripts/backup.cjs import backup.json [merge|replace]");
      console.log("  node scripts/backup.cjs stats");
      process.exit(1);
    }
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
