import { test as base } from '@playwright/test';

// Define custom fixtures
export const test = base.extend({
  // Add custom fixtures here
  // authed: async ({ page }, use) => { ... },
  // guest: async ({ page }, use) => { ... },
});

export { expect } from '@playwright/test';
