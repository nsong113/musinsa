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
    await expect(likeButton).toBeVisible({ timeout: 20000 });
    await likeButton.click({ force: true });
    // 상태 반영에 약간의 지연이 있을 수 있음(애니메이션/네트워크)
    await this.page.waitForTimeout(250);
  }

  async verifyLikeButtonActive(productIndex: number = 0): Promise<void> {
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible({ timeout: 20000 });
    await expect
      .poll(async () => {
        const cls = (await likeButton.getAttribute("class").catch(() => "")) ?? "";
        const ariaPressed =
          (await likeButton.getAttribute("aria-pressed").catch(() => null)) ?? "";
        const ariaLabel =
          (await likeButton.getAttribute("aria-label").catch(() => null)) ?? "";
        const dataState =
          (await likeButton.getAttribute("data-state").catch(() => null)) ?? "";
        const classOk = /active|liked|selected|on/i.test(cls);
        const ariaOk = ariaPressed === "true";
        const labelOk = /취소|해제|좋아요\s*추가됨|좋아요\s*완료/i.test(ariaLabel);
        const dataOk = /on|active|liked|true/i.test(dataState);
        return classOk || ariaOk || labelOk || dataOk;
      })
      .toBeTruthy();
  }

  /** 활성화된 좋아요만 한 번 더 눌러 취소(계정·다음 테스트 오염 방지) */
  async deactivateLikeAt(productIndex: number = 0): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible({ timeout: 15000 });
    const cls = (await likeButton.getAttribute("class").catch(() => "")) ?? "";
    const ariaPressed =
      (await likeButton.getAttribute("aria-pressed").catch(() => null)) ?? "";
    const dataState =
      (await likeButton.getAttribute("data-state").catch(() => null)) ?? "";
    const isActive =
      /active|liked|selected|on/i.test(cls) ||
      ariaPressed === "true" ||
      /on|active|liked|true/i.test(dataState);
    if (!isActive) return;
    await likeButton.click({ force: true });
    await this.page.waitForTimeout(400);
  }
}
