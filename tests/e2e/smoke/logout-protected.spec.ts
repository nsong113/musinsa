// 로그아웃 동작

import { test, expect } from "@playwright/test";

test.describe("Logout", () => {
  test("example logout test", async ({ page }) => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
