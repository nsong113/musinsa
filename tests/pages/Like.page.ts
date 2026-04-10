import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "@/pages/Base.page";

/** 좋아요(하트) 버튼 조작·검증 */
export class LikePage extends BasePage {
  readonly likeButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.likeButtons = page.locator(
      '[aria-label*="좋아요"], [data-button-name*="좋아요"], button[class*="like" i]',
    );
  }

  async clickLikeButton(productIndex: number = 0): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible();
    await likeButton.click({ force: true });
  }

  async verifyLikeButtonActive(productIndex: number = 0): Promise<void> {
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toHaveClass(/active|liked|selected|on/i);
  }

  /** 활성화된 좋아요만 한 번 더 눌러 취소(계정·다음 테스트 오염 방지) */
  async deactivateLikeAt(productIndex: number = 0): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible({ timeout: 15000 });
    const cls = (await likeButton.getAttribute("class")) ?? "";
    if (!/active|liked|selected|on/i.test(cls)) return;
    await likeButton.click({ force: true });
    await this.page.waitForTimeout(400);
  }
}
