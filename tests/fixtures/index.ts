import { test as base } from "@playwright/test";

// Define custom fixtures
export const test = base.extend({
  // Add custom fixtures here
  // authed: async ({ page }, use) => { ... },
  // guest: async ({ page }, use) => { ... },
  page: async ({ page }, use) => {
    // 먼저 도메인으로 이동
    await page.goto("https://www.musinsa.com");

    await page.context().addCookies([
      {
        name: "country",
        value: "KR",
        domain: ".musinsa.com",
        path: "/",
      },
    ]);

    // 그 다음 메인 페이지로
    await page.goto("/");

    await use(page);
  },
});

export { expect } from "@playwright/test";
