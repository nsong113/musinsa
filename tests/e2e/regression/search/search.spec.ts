import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test("example Search test", async ({ page }) => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});

