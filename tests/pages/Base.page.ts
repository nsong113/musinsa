import { Page, Locator } from "@playwright/test";

//공통

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goTo(path: string) {
    await this.page.goto(path);
  }

  async goToMain() {
    await this.page.goto("https://www.musinsa.com/main/musinsa/recommend?gf=A");
  }

  /** 풀스크린 Dim(프로모션·바텀시트 등)이 있으면 클릭이 가로막힘 */
  protected async dismissPointerBlockingOverlays(): Promise<void> {
    const dim = this.page.locator('[data-mds="Dim"]');
    for (let i = 0; i < 8; i++) {
      const visible = await dim
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) return;
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
  }
}
