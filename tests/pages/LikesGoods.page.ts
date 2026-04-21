import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "@/pages/Base.page";
import { HeaderComponent } from "@/pages/components/Header.comp";

/** 좋아요(찜) · 상품 탭 (/like/goods) — 비로그인이면 찜 목록이 반영되지 않거나 `상품 0`만 보일 수 있음 */
export class LikesGoodsPage extends BasePage {
  readonly main: Locator;

  constructor(page: Page) {
    super(page);
    this.main = page.locator("main").first();
  }

  /** 비로그인·세션 만료 시 찜이 비어 보임 — 원인 구분용 */
  async assertLoggedIn(): Promise<void> {
    const header = new HeaderComponent(this.page);
    await header.assertAuthenticatedSession();
  }

  async gotoLikesGoods(): Promise<void> {
    await this.page.goto("/like/goods", { waitUntil: "domcontentloaded", timeout: 90000 });
    await this.page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => {});
    await this.assertLoggedIn();
  }

  /** 상단 탭에서 '상품(N)' 선택 — 접근성 이름이 `상품 0` 등인 경우가 많아 role=tab(^상품$)만으로는 누락될 수 있음 */
  async openProductLikesTab(): Promise<void> {
    const inMain = this.main.getByText(/^상품\s*\d*$/).first();
    const loose = this.page.getByRole("tab", { name: /상품/ }).first();
    const tab = (await inMain.isVisible().catch(() => false)) ? inMain : loose;
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      await this.page.waitForTimeout(500);
    }
  }

  productLinkById(productId: string): Locator {
    return this.page.locator(`a[href*="/products/${productId}"]`).first();
  }

  /**
   * 좋아요 목록에서 해당 상품 카드 영역 텍스트·브랜드 추출
   */
  async getLikedRowSnapshot(productId: string): Promise<{
    raw: string;
    brandText: string;
    brandHref: string;
    titleText: string;
  }> {
    const link = this.productLinkById(productId);
    await expect(link).toBeVisible({ timeout: 30000 });

    const data = await link.evaluate((el, pid: string) => {
      const a = el as HTMLAnchorElement;
      let cur: HTMLElement | null = a;
      let best = "";
      for (let i = 0; i < 14 && cur; i++) {
        const t = (cur.innerText ?? "").replace(/\s+/g, " ").trim();
        if (t.length > best.length) best = t;
        cur = cur.parentElement;
      }
      // 썸네일 링크와 브랜드 링크가 형제 영역에 있어 가장 가까운 Item/Card만으로는 brand를 못 찾는 경우가 있음
      let scope: HTMLElement | null = a;
      for (let i = 0; i < 18 && scope; i++) {
        if (scope.querySelector('a[href*="/brand/"]')) break;
        scope = scope.parentElement;
      }
      if (!scope) scope = a.parentElement;
      const brandA = scope?.querySelector('a[href*="/brand/"]');
      const brandText = (brandA?.textContent ?? "").replace(/\s+/g, " ").trim();
      const brandHref = brandA?.getAttribute("href") ?? "";

      let titleText = "";
      const productAnchors = scope?.querySelectorAll(`a[href*="/products/${pid}"]`) ?? [];
      for (const node of Array.from(productAnchors)) {
        const x = node as HTMLAnchorElement;
        const ar = x.getAttribute("aria-label") ?? "";
        const t = (x.textContent ?? "").replace(/\s+/g, " ").trim();
        let cand = t;
        if (/상품\s*상세로\s*이동|상품상세로\s*이동/i.test(ar)) {
          cand = ar
            .replace(/\s*상품\s*상세로\s*이동\s*$/i, "")
            .replace(/\s*상품상세로\s*이동\s*$/i, "")
            .trim();
        }
        if (cand.length > titleText.length) titleText = cand;
      }
      if (!titleText) {
        titleText = (a.textContent ?? "").replace(/\s+/g, " ").trim();
      }
      return {
        raw: best,
        brandText,
        brandHref,
        titleText,
      };
    }, productId);

    return {
      raw: data.raw,
      brandText: data.brandText,
      brandHref: data.brandHref,
      titleText: data.titleText,
    };
  }

  likeButtonForProduct(productId: string): Locator {
    const link = this.productLinkById(productId);
    return link
      .locator("xpath=ancestor::*[.//a[contains(@href,'/products/')]][1]")
      .locator(
        'button[aria-label*="좋아요"], [data-button-name*="좋아요"], button[class*="like" i]',
      )
      .first();
  }

  async verifyAtLeastOneProductCard(): Promise<void> {
    await expect(this.page.locator('a[href*="/products/"]').first()).toBeVisible({
      timeout: 30000,
    });
  }

  /** 찜한 상품 카드에 좋아요(하트) 컨트롤이 보인다 — 목록 UI는 활성 속성 표기가 PLP와 달라 채움 여부는 DOM 대신 058 노출로 간접 확인 */
  async verifyLikeHeartControlOnProduct(productId: string): Promise<void> {
    const heart = this.likeButtonForProduct(productId);
    await expect(heart).toBeVisible({ timeout: 20000 });
  }
}
