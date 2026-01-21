import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('example login test', async ({ page }) => {
    // Arrange
    
    // Act
    
    // Assert
    await expect(page).toHaveURL(/.*/);
  });
});
