import { test, expect } from "@/fixtures/index";

// 게스트 접근 가능한가

test.describe("Guest Auth Gate", () => {
  test("example test case", async ({ page }) => {
    // Arrange

    // Act
    // 이름 변경 test
    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
