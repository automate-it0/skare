const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  console.log("Users:", await db.user.count());
  console.log("  Admins:", await db.user.count({ where: { role: "ADMIN" } }));
  console.log("Categories:", await db.category.count());
  console.log("Products:", await db.product.count());
  console.log("Orders:", await db.order.count());
  console.log("Coupons:", await db.discountCode.count());
  console.log("");
  console.log("=== Products ===");
  const products = await db.product.findMany({ include: { category: true } });
  products.forEach(p => console.log(`  ${p.name} — ${p.price} EGP (cat: ${p.category?.name || "—"})`));
  console.log("");
  console.log("=== Categories ===");
  const cats = await db.category.findMany({ include: { children: true } });
  cats.forEach(c => {
    console.log(`  ${c.name}`);
    c.children.forEach(ch => console.log(`    - ${ch.name}`));
  });
  console.log("");
  console.log("=== Admins ===");
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true, fullName: true } });
  admins.forEach(a => console.log(`  ${a.email} (${a.fullName})`));
  await db.$disconnect();
})();
