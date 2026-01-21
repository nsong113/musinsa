import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole("textbox", {
      name: "통합계정 또는 이메일",
    });

    this.passwordInput = page.getByRole("textbox", {
      name: "비밀번호 입력",
    });
    this.loginButton = page.getByRole("button", {
      name: "로그인",
    });
  }

  // Locators

  // Methods
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
