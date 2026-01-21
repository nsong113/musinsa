import { Page, Locator } from "@playwright/test";
import { LoginPage } from "../Login.page";

export class HeaderComponent {
  readonly page: Page;
  readonly search: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByRole("link", { name: "로그인 페이지로 이동" });
    this.logoutButton = page.getByRole("link", { name: "로그아웃" });
    // this.search = page.getByRole("button", {});
  }

  // Locators

  // Methods

  async clickingLoginBtn(): Promise<LoginPage> {
    await this.loginButton.click();
    return new LoginPage(this.page);
  }
}
