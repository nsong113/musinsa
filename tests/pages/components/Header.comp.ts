import { Page, Locator, expect } from "@playwright/test";
import { LoginPage } from "../Login.page";

export class HeaderComponent {
  readonly page: Page;
  readonly search: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginButton = page.locator('a[aria-label="로그인 페이지로 이동"]');
    this.logoutButton = page.locator('a[aria-label="로그아웃"]');
  }

  // Locators

  // Methods

  async clickingLoginBtn(): Promise<LoginPage> {
    await expect(this.loginButton).toBeVisible({ timeout: 10000 });

    await this.loginButton.click({ timeout: 10000 });

    await this.page.waitForURL(/.*\/login.*/);
    return new LoginPage(this.page);
  }
}
