# Skare Store

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
# عدّل القيم في .env:
# - NEXTAUTH_SECRET: ولّده بـ `openssl rand -base64 32`
# - ADMIN_EMAIL: إيميلك (سيصبح أدمن)
# - ADMIN_PASSWORD (اختياري): كلمة سر الأدمن
```

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

## 📝 الترخيص

MIT — استخدمه بحرية لمشاريعك.

## 🤝 المساهمة

PRs مرحب بها! افتح issue للنقاش قبل أي تغيير كبير.
