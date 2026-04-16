import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "@/pages/Base.page";

/**
 * 상품 상세 (/products/:id)
 * 셀렉터는 무신사 PDP 레이아웃 변경에 대비해 여 단계 폴백을 둔다.
 */
export class ProductDetailPage extends BasePage {
  /** PDP는 `<main>` 없이 `#__next`만 쓰는 경우가 있어 본문은 page 기준으로 탐색 */
  readonly main: Locator;

  constructor(page: Page) {
    super(page);
    this.main = page.locator("main").first();
  }

  async waitForProductDetailLoaded(timeout = 60000): Promise<void> {
    await expect(this.page).toHaveURL(/\/products\/\d+/, { timeout });
    await this.page.waitForLoadState("domcontentloaded");
    // `or()` 여러 개를 한 expect에 쓰면 strict 위반이 나므로 브랜드 링크 단일 기준
    await expect(this.page.locator('a[href*="/brand/"]').first()).toBeVisible({
      timeout: 45000,
    });
  }

  /** 상품명 — `prd_title` 블록 우선, 없으면 og:title·document.title */
  async getProductTitle(): Promise<string> {
    const box = this.page.locator('[data-section-name="prd_title"]');
    const h1 = box.locator("h1").first();
    if (await h1.isVisible().catch(() => false)) {
      return (await h1.innerText()).replace(/\s+/g, " ").trim();
    }
    const h2 = box.locator("h2").first();
    if (await h2.isVisible().catch(() => false)) {
      return (await h2.innerText()).replace(/\s+/g, " ").trim();
    }
    const typoes = box.locator('[data-mds="Typography"]');
    const tn = await typoes.count();
    for (let i = 0; i < tn; i++) {
      const t = ((await typoes.nth(i).innerText()) ?? "").replace(/\s+/g, " ").trim();
      if (t.length > 8 && !/브랜드숍|바로가기|더보기/i.test(t)) return t;
    }
    const og = await this.page
      .locator('meta[property="og:title"]')
      .getAttribute("content")
      .catch(() => null);
    if (og) {
      return og.split(/\|/)[0].replace(/\s+/g, " ").trim();
    }
    const title = await this.page.title();
    return title.split(/\|/)[0].replace(/\s+/g, " ").trim();
  }

  /** 가격·할인 비교용: 본문 텍스트(금액·% 포함) */
  async getPriceAreaText(): Promise<string> {
    const scope = (await this.main.isVisible().catch(() => false))
      ? this.main
      : this.page.locator("body");
    await expect(
      this.page.getByText(/\d{1,3}(?:,\d{3})*\s*원|\d{4,}\s*원/).first(),
    ).toBeVisible({ timeout: 30000 });
    return (await scope.innerText()).replace(/\s+/g, " ").trim();
  }

  /**
   * 대표 상품 이미지(충분한 크기로 보이는 첫 img)
   */
  async getMainProductImage(): Promise<Locator> {
    const root = (await this.main.isVisible().catch(() => false))
      ? this.main
      : this.page.locator("body");
    const imgs = root.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < Math.min(count, 24); i++) {
      const img = imgs.nth(i);
      const src = await img.getAttribute("src");
      if (!src || src.startsWith("data:")) continue;
      const box = await img.boundingBox().catch(() => null);
      if (box && box.width >= 100 && box.height >= 100) return img;
    }
    return this.main.locator("img").first();
  }

  async verifyMainProductImageVisible(): Promise<void> {
    const img = await this.getMainProductImage();
    await expect(img).toBeVisible({ timeout: 20000 });
    const src = await img.getAttribute("src");
    expect(src && src.length > 8).toBeTruthy();
  }

  async getMainProductImageSrc(): Promise<string> {
    const img = await this.getMainProductImage();
    return (await img.getAttribute("src")) ?? "";
  }
}
