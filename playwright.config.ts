import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1, // sequential — tests share a CUSTOMER_EMAIL constant
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    locale: "ar-EG",
  },
  webServer: {
    command: "echo 'dev server already running'",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 5_000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
