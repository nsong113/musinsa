import { Page, Locator, expect } from "@playwright/test";

/**
 * MainPage - 메인 페이지
 *
 * 역할: 메인 페이지의 요소와 액션을 관리
 */
export class MainPage {
  readonly page: Page;
  readonly itemBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.itemBanner = page.getByTestId("virtuoso-item-list");
  }

  // Methods

  /**
   * 메인 페이지로 이동
   */
  async goToMain(): Promise<void> {
    await this.page.goto("/");

    // await this.page.getByTestId("virtuoso-item-list");

    await expect(this.itemBanner).toBeVisible();
  }
}
