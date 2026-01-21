import { test, expect } from '@playwright/test';

// 게스트 접근 가능한가

test.describe('Guest Auth Gate', () => {
  test('example test case', async ({ page }) => {
    // Arrange
    
    // Act
    
    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
