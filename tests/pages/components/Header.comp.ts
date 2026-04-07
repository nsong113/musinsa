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
  readonly searchBtn: Locator;

  readonly searchTabInput: Locator;
  readonly searchTabBtn: Locator;
  readonly searchTabRecommend: Locator;

  readonly recommends: Locator;
  readonly searchResultSection: Locator;
  readonly brandSection: Locator;
  readonly keywordSection: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginButton = page.getByRole("link", { name: "로그인 페이지로 이동" });
    this.logoutButton = page.getByRole("link", { name: "로그아웃" });

    this.searchInput = page.getByRole("textbox", { name: "검색창" });
    this.searchBtn = page.getByRole("button", { name: "검색버튼" });

    this.searchTabInput = page.getByPlaceholder("검색어를 입력하세요");
    this.searchTabBtn = page.getByRole("button", { name: "검색", exact: true });
    this.searchTabRecommend = page.getByText("인기 검색어");

    this.searchResultSection = page.getByRole("region", { name: /검색 결과$/ });
    this.brandSection = page.locator('[data-section-name="sgt_result_brand"]');
    this.keywordSection = page.locator(
      '[data-section-name="sgt_result_keyword"]'
    );
    this.recommends = this.keywordSection.locator("li");
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
        await this.searchInput.focus();
        await this.searchInput.click();
        await expect(this.searchTabInput).toBeFocused();
        break;
      case "tab":
        await expect(this.searchTabInput).toBeVisible();
        await this.searchTabInput.focus();
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
    // await this.useSearchTab(message);
    await this.searchTabInput.pressSequentially(message, { delay: 100 });

    await expect(this.searchResultSection.first()).toBeVisible();

    //brandSection의 count를 바로 expect안에서 못하고 밖으로 빼야 하는 이유
    const brandCount = await this.brandSection.count();
    await expect(brandCount).toBeGreaterThan(0);
    //brandSection말고 first를 사용해서 toBeVisible를 해야하는 이유
    await expect(this.brandSection.first()).toBeVisible();

    const keywordCount = await this.keywordSection.count();
    await expect(keywordCount).toBeGreaterThan(0);
    await expect(this.keywordSection.first()).toBeVisible();

    //////
    await expect(this.recommends.first()).toBeVisible();
    const recommendCount = await this.recommends.count();
    expect(recommendCount).toBeGreaterThan(0);
    ////

    for (let i = 0; i < recommendCount; i++) {
      const recommend = this.recommends.nth(i);
      await expect(recommend).toBeVisible();
      await expect(recommend).toContainText(message);
    }

    await this.searchTabBtn.click();
  }
}
