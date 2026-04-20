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

    // 접근성 라벨/문구 변경(로그인 페이지로 이동 등) 대비
    this.loginButton = page
      .getByRole("link", { name: /로그인/ })
      .or(page.getByText(/^로그인$/).first());
    this.logoutButton = page.getByRole("link", { name: "로그아웃" });

    this.searchInput = page.getByRole("textbox", { name: "검색창" });
    this.searchOpenButton = page.locator('[data-button-id="search_window"]');

    this.searchTabInput = page.getByPlaceholder("검색어를 입력하세요");
    this.searchTabBtn = page.getByRole("button", { name: "검색", exact: true });
    /** 사이트 카피 변경 대비(실시간 인기 등) */
    this.searchTabRecommend = page.getByText(
      /인기\s*검색어|실시간\s*인기|추천\s*검색어/,
    );
  }

  // Locators

  // Methods

  async clickingLoginBtn(): Promise<LoginPage> {
    await expect(this.loginButton.first()).toBeVisible({ timeout: 15000 });

    await this.loginButton.first().click({ timeout: 15000 });

    await this.page.waitForURL(/.*\/login.*/);
    return new LoginPage(this.page);
  }

  /** 같은 세션에서 좋아요를 눌렀다면, 가능하면 해당 화면에서 좋아요 취소 후 호출(계정·후속 테스트 정합성) */
  async clickingLogoutBtn() {
    await expect(this.logoutButton).toBeVisible();

    await this.logoutButton.click();

    await expect(this.loginButton).toBeVisible();
  }

  async verifySearchTabOpened(): Promise<void> {
    await expect(this.searchTabInput).toBeVisible();
    await expect(this.searchTabBtn).toBeVisible();

    // UI가 바뀌면 '인기 검색어' 대신 #TAGS 등으로 노출될 수 있음
    await expect(
      this.searchTabRecommend.or(this.page.getByText("#TAGS")),
    ).toBeVisible({ timeout: 15000 });
  }

  async focusSearchInput(mode: "main" | "tab") {
    switch (mode) {
      case "main":
        await expect(this.searchInput).toBeVisible();
        /** 메인 빅배너·딤이 검색 버튼 위에 있으면 클릭이 캠페인으로 새 탭/이동할 수 있음 */
        await this.page.keyboard.press("Escape");
        await this.page.waitForTimeout(200);
        await this.searchOpenButton.scrollIntoViewIfNeeded();
        await expect(this.page).toHaveURL(/\/main\/musinsa\//, {
          timeout: 10000,
        });
        await this.searchOpenButton.click({ force: true });
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
