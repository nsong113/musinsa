import { test, expect } from '@playwright/test';

test.describe('Brand', () => {
  test("example Brand test", async ({ page }) => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});

