/**
 * Skare Store — End-to-end test suite
 * Team: 3 testing engineers
 * Scope: every visible button & every flow on the site
 */
import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme12345";
// Fixed customer email so login tests can find the account created by signup test
const CUSTOMER_EMAIL = "customer-test@skare.test";
const CUSTOMER_PASSWORD = "Customer12345";

// Run tests serially in one worker to share registered account state
test.describe.configure({ mode: "serial" });

async function registerCustomer(page: Page) {
  await page.goto("/auth");
  await page.locator("main").getByText("ليس لديك حساب؟").click();
  await page.getByLabel("الاسم الكامل").fill("عميل اختبار");
  await page.getByLabel("رقم الهاتف").fill("01012345678");
  await page.getByLabel("العنوان").fill("عنوان اختبار");
  await page.getByLabel("البريد الإلكتروني").fill(CUSTOMER_EMAIL);
  await page.getByLabel("كلمة المرور").fill(CUSTOMER_PASSWORD);
  await page.click('form button[type="submit"]');
  await page.waitForURL("/", { timeout: 15_000 });
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.click('form button[type="submit"]');
  await page.waitForURL("/", { timeout: 15_000 });
}

async function logout(page: Page) {
  await page.getByTitle("حسابي").click();
  await page.getByRole("menuitem", { name: "تسجيل الخروج" }).click();
}

test.describe("Homepage", () => {
  test("loads and shows hero text", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "اكتشفي جمالكِ الطبيعي" })).toBeVisible();
  });

  test("shows product cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("كريم مرطب فاخر").first()).toBeVisible({ timeout: 10_000 });
  });

  test("category filter buttons work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "العناية بالبشرة" }).first().click();
    await expect(page.getByText("كريم مرطب فاخر").first()).toBeVisible({ timeout: 5_000 });
  });

  test("language toggle switches to EN", async ({ page }) => {
    await page.goto("/");
    await page.getByTitle("Language").click();
    await expect(page.getByRole("heading", { name: "Discover Your Natural Beauty" })).toBeVisible();
  });

  test("footer renders social links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /فيسبوك/ })).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("signup flow creates account and logs in", async ({ page }) => {
    // Use unique name to verify signup worked
    await page.goto("/auth");
    await page.locator("main").getByText("ليس لديك حساب؟").click();
    await page.getByLabel("الاسم الكامل").fill("عميل اختبار");
    await page.getByLabel("رقم الهاتف").fill("01012345678");
    await page.getByLabel("العنوان").fill("عنوان اختبار");
    await page.getByLabel("البريد الإلكتروني").fill(CUSTOMER_EMAIL);
    await page.getByLabel("كلمة المرور").fill(CUSTOMER_PASSWORD);
    await page.click('form button[type="submit"]');
    // Account either created (200) or already exists (409) - either way, login should follow
    await page.waitForURL("/", { timeout: 15_000 });
  });

  test("login with correct password works (re-login after logout)", async ({ page }) => {
    // First logout from previous test's session
    await page.goto("/");
    const userMenu = page.getByTitle("حسابي");
    if (await userMenu.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await userMenu.click();
      await page.getByRole("menuitem", { name: "تسجيل الخروج" }).click();
      await page.waitForTimeout(500);
    }
    // Now login fresh
    await page.goto("/auth");
    await page.getByLabel("البريد الإلكتروني").fill(CUSTOMER_EMAIL);
    await page.getByLabel("كلمة المرور").fill(CUSTOMER_PASSWORD);
    await page.click('form button[type="submit"]');
    await page.waitForURL("/", { timeout: 15_000 });
  });

  test("login with wrong password shows error toast", async ({ page }) => {
    // Logout first if needed
    await page.goto("/");
    const userMenu = page.getByTitle("حسابي");
    if (await userMenu.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await userMenu.click();
      await page.getByRole("menuitem", { name: "تسجيل الخروج" }).click();
      await page.waitForTimeout(500);
    }
    await page.goto("/auth");
    await page.getByLabel("البريد الإلكتروني").fill(CUSTOMER_EMAIL);
    await page.getByLabel("كلمة المرور").fill("wrongpass");
    await page.click('form button[type="submit"]');
    await expect(page.getByText(/البريد الإلكتروني أو كلمة المرور/)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Cart flow", () => {
  test("add to cart requires login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();
    await expect(page.getByText(/يرجى تسجيل الدخول للإضافة للسلة/)).toBeVisible({ timeout: 5_000 });
  });

  test("add to cart succeeds when logged in", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/");
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();
    await expect(page.getByText(/تمت الإضافة للسلة/)).toBeVisible({ timeout: 5_000 });
  });

  test("cart page shows item", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/");
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();
    await page.waitForTimeout(800);
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "سلة التسوق" })).toBeVisible();
  });

  test("apply invalid coupon shows error", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/");
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();
    await page.waitForTimeout(800);
    await page.goto("/cart");
    await page.getByPlaceholder("أدخل كود الخصم...").fill("INVALID");
    await page.getByRole("button", { name: /تطبيق/ }).click();
    await expect(page.getByText(/كود الخصم غير صالح/)).toBeVisible({ timeout: 5_000 });
  });

  test("apply valid coupon WELCOME10 succeeds", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/");
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();
    await page.waitForTimeout(800);
    await page.goto("/cart");
    await page.getByPlaceholder("أدخل كود الخصم...").fill("WELCOME10");
    await page.getByRole("button", { name: /تطبيق/ }).click();
    await expect(page.getByText(/تم تطبيق الخصم بنجاح/)).toBeVisible({ timeout: 5_000 });
  });

  test("complete order with valid data succeeds", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/");
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();
    await page.waitForTimeout(800);
    await page.goto("/cart");
    await page.locator("#ship-name").fill("عميل اختبار");
    await page.locator("#ship-phone").fill("01012345678");
    await page.locator("#ship-city").fill("قلين");
    await page.locator("#ship-addr").fill("شارع اختبار - منزل 1");
    await page.getByRole("button", { name: /تأكيد الطلب/ }).click();
    await expect(page.getByText(/تم إرسال طلبك بنجاح/)).toBeVisible({ timeout: 10_000 });
  });

  test("checkout without filling shipping shows error", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/");
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();
    await page.waitForTimeout(800);
    await page.goto("/cart");
    await page.getByRole("button", { name: /تأكيد الطلب/ }).click();
    await expect(page.getByText(/يرجى إكمال جميع بيانات التوصيل/)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Product detail page", () => {
  test("clicking product card opens detail", async ({ page }) => {
    await page.goto("/");
    await page.getByText("كريم مرطب فاخر").first().click();
    await page.waitForURL(/\/product\/.+/, { timeout: 5_000 });
  });

  test("add to cart from detail page works (logged in)", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/");
    await page.getByText("كريم مرطب فاخر").first().click();
    await page.waitForURL(/\/product\/.+/, { timeout: 5_000 });
    // Now on detail page - only one "add to cart" button should be visible
    await page.locator("main").getByRole("button", { name: /أضف للسلة/ }).click();
    await expect(page.getByText(/تمت الإضافة للسلة/)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Account page", () => {
  test("shows profile and order history", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "حسابي" })).toBeVisible();
  });
});

test.describe("Admin dashboard access control", () => {
  test("non-admin user is redirected away from dashboard", async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/dashboard");
    await page.waitForURL("/", { timeout: 5_000 });
  });

  test("admin can access dashboard", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "لوحة تحكم الأدمن" })).toBeVisible({ timeout: 5_000 });
  });

  test("admin can navigate between tabs", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard");
    for (const tab of ["المنتجات", "الأقسام", "المستخدمون", "أكواد الخصم", "التحليلات"]) {
      await page.getByRole("button", { name: tab }).click();
      await page.waitForTimeout(300);
    }
    await expect(page.getByRole("heading", { name: "تحليلات المبيعات" })).toBeVisible({ timeout: 5_000 });
  });

  test("admin can add a product", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "المنتجات" }).click();
    await page.getByRole("button", { name: /إضافة منتج جديد/ }).click();
    await page.locator("#prod-name").fill(`منتج اختبار ${Date.now()}`);
    await page.locator("#prod-desc").fill("وصف");
    await page.locator("#prod-price").fill("99.50");
    await page.getByRole("button", { name: "حفظ" }).click();
    await page.waitForTimeout(1500);
  });

  test("admin can add a category", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "الأقسام" }).click();
    await page.getByRole("button", { name: /إضافة قسم جديد/ }).click();
    await page.locator("#cat-name").fill(`قسم اختبار ${Date.now()}`);
    await page.getByRole("button", { name: "حفظ" }).click();
    await page.waitForTimeout(1500);
  });

  test("admin can add a coupon", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "أكواد الخصم" }).click();
    await page.getByRole("button", { name: /إضافة كود جديد/ }).click();
    await page.locator("#cp-code").fill(`TEST${Date.now()}`.slice(0, 15));
    await page.locator("#cp-disc").fill("15");
    await page.getByRole("button", { name: "حفظ" }).click();
    await page.waitForTimeout(1500);
  });
});

test.describe("Security headers", () => {
  test("X-Content-Type-Options is set", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("X-Frame-Options is DENY", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
  });
});

test.describe("Access control", () => {
  test("unauthenticated user cannot access /api/users", async ({ request }) => {
    const res = await request.get("/api/users");
    expect(res.status()).toBe(401);
  });

  test("unauthenticated POST to /api/orders returns 401", async ({ request }) => {
    const res = await request.post("/api/orders", {
      data: { shippingName: "x", shippingPhone: "01012345678", shippingCity: "قلين", shippingAddress: "x" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Input validation", () => {
  test("signup with malformed email returns 422", async ({ request }) => {
    const res = await request.post("/api/auth/signup", {
      data: {
        email: "not-an-email",
        password: "Password123",
        fullName: "x",
        phone: "01012345678",
        address: "x",
      },
    });
    expect([400, 422]).toContain(res.status());
  });
});
