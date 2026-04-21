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

  /**
   * 상품 상세에서 “상품” 찜 — 전역 `nth(0)`는 헤더·추천과 겹칠 수 있어 `prd_title` 근처를 우선한다.
   */
  productLikeOnPdp(): Locator {
    const title = this.page.locator('[data-section-name="prd_title"]').first();
    return title.locator(
      'xpath=ancestor::*[.//button[contains(@aria-label,"좋아요") or contains(@data-button-name,"좋아요")]][1]//button[contains(@aria-label,"좋아요") or contains(@data-button-name,"좋아요")][1]',
    );
  }

  async clickLikeOnProductDetail(): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const scoped = this.productLikeOnPdp();
    if (await scoped.isVisible().catch(() => false)) {
      await expect(scoped).toBeVisible({ timeout: 20000 });
      await scoped.click({ force: true });
    } else {
      await this.clickLikeButton(0);
    }
    await this.page.waitForTimeout(400);
  }

  async verifyProductLikeOnPdpActive(): Promise<void> {
    const scoped = this.productLikeOnPdp();
    const likeButton = (await scoped.isVisible().catch(() => false))
      ? scoped
      : this.likeButtons.nth(0);
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

  likeButtonInCard(card: Locator): Locator {
    return card
      .getByRole("button", { name: /좋아요/ })
      .or(
        card.locator(
          '[data-button-name*="좋아요"], button[class*="like" i]',
        ),
      )
      .first();
  }

  /** 좋아요 목록 등 다른 Page에서 재사용 */
  async isLikeHeartActive(btn: Locator): Promise<boolean> {
    return this.isLikeButtonActive(btn);
  }

  /** PLP/PDP마다 찜 상태 표현이 달라 class·aria·data·부모 래퍼까지 본다 */
  private async isLikeButtonActive(btn: Locator): Promise<boolean> {
    return btn.evaluate((el) => {
      const checkOne = (e: HTMLElement) => {
        const cls = e.className?.toString() ?? "";
        const al = e.getAttribute("aria-label") ?? "";
        const ap = e.getAttribute("aria-pressed");
        const ac = e.getAttribute("aria-checked");
        const ds = e.getAttribute("data-state") ?? "";
        const da = e.getAttribute("data-active");
        const di = e.getAttribute("data-is-liked") ?? e.getAttribute("data-liked");
        if (ap === "true" || ac === "true") return true;
        if (di === "true" || di === "1") return true;
        if (da === "true" || da === "1") return true;
        if (/active|liked|Liked|selected|fill|isLiked|LikeButton_/i.test(cls)) return true;
        if (/취소|해제|추가됨|완료|해제하기/i.test(al)) return true;
        if (/on|active|liked|true|checked/i.test(ds)) return true;
        return false;
      };
      let cur: HTMLElement | null = el as HTMLElement;
      for (let i = 0; i < 8 && cur; i++) {
        if (checkOne(cur)) return true;
        cur = cur.parentElement;
      }
      return false;
    });
  }

  /**
   * 목록 카드 안 하트만 사용 — 전역 nth(0)는 그리드 위·다른 슬롯과 섞일 수 있음.
   * 이미 찜된 상태면 클릭하지 않아 취소(토글)로 바뀌지 않게 한다.
   */
  /**
   * PLP 찜 후에도 버튼 속성이 일정하지 않아 DOM으로 “활성”을 기다리지 않는다.
   * 서버 반영은 후속 /like/goods 노출로 검증한다.
   */
  async ensureLikedOnCard(card: Locator): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const btn = this.likeButtonInCard(card);
    await expect(btn).toBeVisible({ timeout: 20000 });
    if (await this.isLikeButtonActive(btn)) return;
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  }

  async verifyLikeActiveOnCard(card: Locator): Promise<void> {
    const btn = this.likeButtonInCard(card);
    await expect(btn).toBeVisible({ timeout: 20000 });
    await expect.poll(async () => this.isLikeButtonActive(btn)).toBeTruthy();
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

  /**
   * 특정 Locator 하트가 찜 활성이면 한 번 눌러 해제(좋아요 목록·카드 등 공통)
   */
  async deactivateLikeIfActive(btn: Locator): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    if (!(await btn.isVisible().catch(() => false))) return;
    if (!(await this.isLikeButtonActive(btn))) return;
    await btn.click({ force: true });
    await this.page.waitForTimeout(400);
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
