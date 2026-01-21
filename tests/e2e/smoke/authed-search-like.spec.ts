//인증된 검색/좋아요 동작

import { test, expect } from "@playwright/test";

test.describe("Authenticated Search and Like Actions", () => {
  test("example test case", async ({ page }) => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
