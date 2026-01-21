import { test as base } from "@playwright/test";

// Define custom fixtures
export const test = base.extend({
  // Add custom fixtures here
  // authed: async ({ page }, use) => { ... },
  // guest: async ({ page }, use) => { ... },
  page: async ({ page }, use) => {
    await page.goto("/");

    await use(page);
  },
});

export { expect } from "@playwright/test";
