import { Page, expect } from "@playwright/test";

/**
 * MainPage - 메인 페이지
 *
 * 역할: 메인 페이지의 요소와 액션을 관리
 */
export class MainPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 추천 메인으로 이동 (헤더 검색 등 핵심 UI가 노출되는 경로)
   */
  async goToMain(): Promise<void> {
    await this.page.goto("/main/musinsa/recommend?gf=A", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByRole("textbox", { name: "검색창" })
    ).toBeVisible({ timeout: 45000 });
  }
}
