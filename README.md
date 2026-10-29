<div align="center">

# 🛍️ Skare Store

**Full-stack e-commerce platform for beauty & skincare products** — Next.js 16, Prisma, admin dashboard, bilingual AR/EN, and 29 Playwright E2E tests.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

[![E2E Tests](https://img.shields.io/badge/Playwright-29%20tests-green?logo=playwright)](https://playwright.dev)

</div>

---

متجر إلكتروني متكامل لمنتجات العناية والتجميل، مبني بـ Next.js 16.

## ✨ المميزات

- 🛍️ متجر كامل: تصفح، بحث، فلترة بالأقسام
- 🛒 سلة تسوق + كوبونات خصم
- 📦 إدارة الطلبات مع تتبع الحالة
- 👥 تسجيل/دخول بأمان (NextAuth + bcrypt)
- 🎛️ لوحة أدمن: منتجات، أقسام، مستخدمين، طلبات، كوبونات، تحليلات
- 🗄️ صفحة إدارة قاعدة البيانات: تصدير/استيراد JSON + إحصائيات
- 🌍 دعم عربي/إنجليزي (RTL/LTR)
- 🔒 حماية كاملة: rate limiting, security headers, server-side auth, audit logs
- ✅ 29 اختبار E2E بـ Playwright

## 🛠️ التقنيات

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui**
- **Prisma ORM** + **SQLite**
- **NextAuth.js v4** (Credentials provider, JWT, bcrypt)
- **Zod** للتحقق من المدخلات
- **Playwright** للاختبارات

## 🚀 البدء السريع

### 1) المتطلبات
- Node.js 18+ أو Bun
- لا تحتاج أي حساب cloud — قاعدة البيانات SQLite محلية

### 2) التثبيت
```bash
bun install          # أو npm install
```

### 3) إعداد البيئة
```bash
cp .env.example .env
```

| المتغير | الوصف |
|--------|------|
| `DATABASE_URL` | مسار قاعدة SQLite (افتراضي: `file:./dev.db`) |
| `NEXTAUTH_SECRET` | سر تشفير الجلسات — ولّده بـ `openssl rand -base64 32` |
| `NEXTAUTH_URL` | رابط الموقع (افتراضي: `http://localhost:3000`) |
| `ADMIN_EMAIL` | إيميلك — يصبح حساب الأدمن بعد الـ seed |
| `ADMIN_PASSWORD` | (اختياري) كلمة سر الأدمن — إذا تُركت فارغة يولّدها الـ seed عشوائياً |

### 4) إعداد قاعدة البيانات
```bash
bun run db:push      # يطبّق الـ schema على SQLite
```

### 5) تشغيل الموقع
```bash
bun run dev          # الموقع على http://localhost:3000
```

### 6) إنشاء الأدمن + بيانات تجريبية
```bash
curl -X POST http://localhost:3000/api/seed
```
> الـ response يحتوي على كلمة سر الأدمن المولّدة عشوائياً (إذا لم تضبط `ADMIN_PASSWORD` في `.env`). احفظها وغيّرها بعد أول تسجيل دخول.

## 📜 الـ Scripts

| Script | الوصف |
|--------|------|
| `bun run dev` | تشغيل الـ dev server |
| `bun run build` | بناء الإنتاج |
| `bun run lint` | فحص الكود |
| `bun run db:push` | تطبيق الـ schema على الـ DB |
| `bun run db:reset` | إعادة تعيين الـ DB |
| `bunx playwright test` | تشغيل اختبارات E2E |
| `node scripts/backup.cjs export > backup.json` | تصدير قاعدة البيانات |
| `node scripts/backup.cjs import backup.json` | استيراد قاعدة البيانات |
| `node scripts/backup.cjs stats` | إحصائيات قاعدة البيانات |

## 📁 بنية المشروع

```
src/
├── app/
│   ├── api/                # 18+ API route
│   ├── auth/               # صفحة التسجيل/الدخول
│   ├── cart/               # سلة التسوق
│   ├── product/[id]/       # تفاصيل المنتج
│   ├── account/            # حساب المستخدم
│   ├── dashboard/          # لوحة الأدمن
│   └── page.tsx            # الصفحة الرئيسية
├── components/
│   ├── admin/              # مكوّنات لوحة الأدمن
│   ├── common/             # header, footer, shell, toast
│   ├── shop/               # product card, home content
│   └── ui/                 # shadcn/ui primitives
└── lib/                    # auth, db, validation, security, i18n
tests/
└── e2e/skare.spec.ts       # 29 اختبار Playwright
prisma/
└── schema.prisma           # 8 نماذج
```

## 🔒 الأمان

- ✅ NextAuth + bcrypt (12 rounds) + JWT
- ✅ Server-side role enforcement (`requireAdmin` يفحص الـ DB في كل طلب)
- ✅ Rate limiting: 200/min/IP عالمي، 5/min/IP للتسجيل والطلبات
- ✅ Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- ✅ Zod validation على كل المدخلات
- ✅ Audit log لكل عمليات الأدمن
- ✅ رفع صور آمن (UUID filename, MIME check, 5MB limit)
- ✅ لا توجد أسرار في الكود — كلها في `.env`

## 📊 قاعدة البيانات

- **SQLite** محلية في `db/dev.db` (لا تحتاج أي خدمة خارجية)
- **8 نماذج**: User, Category, Product, CartItem, Order, OrderItem, DiscountCode, UsedCode, AuditLog
- **نسخ احتياطي**: من لوحة الأدمن → تبويب "قاعدة البيانات" → "تصدير"
- **استرجاع**: من نفس التبويب → "استيراد" (دمج أو استبدال)

## 🧪 الاختبارات

29 اختبار E2E بـ Playwright يغطي كل تدفق رئيسي: التصفح، التسجيل والدخول، السلة والكوبونات، إتمام الطلب، صلاحيات الأدمن، والـ security headers.

```bash
bunx playwright install chromium   # مرة واحدة فقط
bunx playwright test              # تشغيل كل الاختبارات
```

## 📝 الترخيص

MIT — استخدمه بحرية لمشاريعك.

## 🤝 المساهمة

PRs مرحب بها! افتح issue للنقاش قبل أي تغيير كبير.
