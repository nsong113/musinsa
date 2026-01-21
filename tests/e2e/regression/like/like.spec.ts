import { test, expect } from "@playwright/test";

test.describe("Like", () => {
  test("example Like test", async ({ page }) => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
