import { test, expect } from "@/fixtures/index";

test.describe("Brand", () => {
  test("example Brand test", async ({ page }) => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
