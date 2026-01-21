import { test, expect } from "@/fixtures/index";

test.describe("Search", () => {
  test("example Search test", async ({ page }) => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
