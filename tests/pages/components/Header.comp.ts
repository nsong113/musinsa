import { Page, Locator, expect } from "@playwright/test";
import { LoginPage } from "../Login.page";

//어떻게 how
// 어떻게 클릭하는지
// 어떻게 입력하는지
// 어떻게 이동하는지

export class HeaderComponent {
  readonly page: Page;

  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly searchInput: Locator;
  /** 헤더 검색창은 래퍼 버튼이 포인터를 가로채므로, 레이어 오픈은 이 버튼으로 클릭 */
  readonly searchOpenButton: Locator;

  readonly searchTabInput: Locator;
  readonly searchTabBtn: Locator;
  readonly searchTabRecommend: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginButton = page.getByRole("link", { name: "로그인 페이지로 이동" });
    this.logoutButton = page.getByRole("link", { name: "로그아웃" });

    this.searchInput = page.getByRole("textbox", { name: "검색창" });
    this.searchOpenButton = page.locator('[data-button-id="search_window"]');

    this.searchTabInput = page.getByPlaceholder("검색어를 입력하세요");
    this.searchTabBtn = page.getByRole("button", { name: "검색", exact: true });
    this.searchTabRecommend = page.getByText("인기 검색어");
  }

  // Locators

  // Methods

  async clickingLoginBtn(): Promise<LoginPage> {
    await expect(this.loginButton).toBeVisible({ timeout: 10000 });

    await this.loginButton.click({ timeout: 10000 });

    await this.page.waitForURL(/.*\/login.*/);
    return new LoginPage(this.page);
  }

  async clickingLogoutBtn() {
    await expect(this.logoutButton).toBeVisible();

    await this.logoutButton.click();

    await expect(this.loginButton).toBeVisible();
  }

  async verifySearchTabOpened(): Promise<void> {
    await expect(this.searchTabInput).toBeVisible();
    await expect(this.searchTabBtn).toBeVisible();

    await expect(this.searchTabRecommend).toBeVisible();
  }

  async focusSearchInput(mode: "main" | "tab") {
    switch (mode) {
      case "main":
        await expect(this.searchInput).toBeVisible();
        await this.searchOpenButton.click();
        await expect(this.searchTabInput).toBeVisible({ timeout: 15000 });
        break;
      case "tab":
        await expect(this.searchTabInput).toBeVisible();
        await this.searchTabInput.click();
        await expect(this.searchTabInput).toBeFocused();
        break;
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  }

  async search(message: string, mode: "main" | "tab" = "main") {
    await this.focusSearchInput(mode);
    await this.verifySearchTabOpened();
    await this.searchTabInput.fill(message);
    await this.searchTabBtn.click();
    await expect(this.page).toHaveURL(/keyword=/, { timeout: 45000 });
  }
}
