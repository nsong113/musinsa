import { Page, Locator, expect } from "@playwright/test";

export class SearchResultPage {
  readonly page: Page;

  readonly relatedKeywords: Locator;
  readonly relatedKeyword: Locator;

  readonly searchTabs: Locator;
  readonly totalProductCount: Locator;
  readonly productList: Locator;
  readonly brandFilter: Locator;
  readonly likeButtons: Locator;

  constructor(page: Page) {
    this.page = page;

    this.relatedKeywords = page.locator('[data-content-name="연관 검색어"]');

    this.relatedKeyword = this.relatedKeywords.locator("button, a[href]");

    this.searchTabs = page.locator('[role="tablist"]').or(page.locator("nav"));

    this.totalProductCount = page
      .getByText(/전체\s*[\d,]+\s*개/)
      .or(page.getByText(/총\s*[\d,]+\s*개/))
      .or(page.getByText(/^[\d,]+\s*개$/))
      .or(page.getByText(/새\s*상품\s*[\d,]+/));

    /** 카드 단위(썸네일·가격·텍스트 동일 영역). 이미지 전용 링크만 있던 a는 제외 */
    this.productList = page
      .locator('[class*="UIItemContainer"]')
      .filter({ has: page.locator('a[href*="/products/"]') });

    this.brandFilter = page
      .getByRole("button", { name: /브랜드/ })
      .or(page.getByText("브랜드", { exact: true }).first());

    this.likeButtons = page.locator(
      '[aria-label*="좋아요"], [data-button-name*="좋아요"], button[class*="like" i]',
    );
  }

  async verifyRelatedKeywords(): Promise<void> {
    const section = this.page.locator('[data-content-name="연관 검색어"]');
    await expect(section).toBeVisible({ timeout: 20000 });
    const chips = section.locator("button, a[href]");
    await expect(chips.first()).toBeVisible();
    const n = await chips.count();
    expect(n).toBeGreaterThan(0);
  }

  /** 풀스크린 Dim(프로모션·바텀시트 등)이 있으면 연관검색어 클릭이 가로막힘 */
  private async dismissPointerBlockingOverlays(): Promise<void> {
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

  async clickFirstRelatedKeyword(): Promise<void> {
    const section = this.page.locator('[data-content-name="연관 검색어"]');
    await expect(section).toBeVisible({ timeout: 20000 });
    const first = section.locator("button, a[href]").first();
    await expect(first).toBeVisible();
    await this.dismissPointerBlockingOverlays();
    await first.click({ force: true });
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 30000 }).catch(
      () => {},
    );
  }

  async verifySearchTabs(): Promise<void> {
    const required = ["상품", "스냅/코디", "혜택"];
    const optional = ["콘텐츠", "발매"];
    for (const label of required) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tab = this.page
        .getByRole("tab", { name: new RegExp(escaped) })
        .or(this.page.getByRole("link", { name: new RegExp(escaped) }))
        .or(this.page.locator(`button[data-button-name="${label}"]`));
      await expect(tab.first()).toBeVisible({ timeout: 20000 });
    }
    for (const label of optional) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tab = this.page
        .getByRole("tab", { name: new RegExp(escaped) })
        .or(this.page.getByRole("link", { name: new RegExp(escaped) }))
        .or(this.page.locator(`button[data-button-name="${label}"]`));
      await expect.soft(tab.first()).toBeVisible({ timeout: 10000 });
    }
  }

  /** 기본 노출 탭(상품)이 보이고 검색 결과 컨텍스트에 있다 */
  async verifyDefaultProductTab(): Promise<void> {
    const 상품 = this.page
      .getByRole("tab", { name: /^상품$/ })
      .or(this.page.getByRole("link", { name: /^상품$/ }))
      .or(this.page.locator('button[data-button-name="상품"]'))
      .first();
    await expect(상품).toBeVisible({ timeout: 20000 });
    await expect(this.page).toHaveURL(/search|keyword=/);
  }

  async verifyTotalProductCount(): Promise<void> {
    const main = this.page.locator("main").first();
    const countEl = main
      .getByText(/전체\s*[\d,]+\s*개/)
      .or(main.getByText(/총\s*[\d,]+\s*개/))
      .or(main.getByText(/^[\d,]+\s*개$/))
      .or(main.getByText(/새\s*상품\s*[\d,]+/))
      .first();
    await expect(countEl).toBeVisible({ timeout: 20000 });
    const countText = await countEl.textContent();
    const n = parseInt(countText?.replace(/[^\d]/g, "") || "0", 10);
    expect(n).toBeGreaterThan(0);
  }

  async verifyProductList(): Promise<void> {
    const first = this.productList.first();
    await expect(first).toBeVisible({ timeout: 25000 });
    const n = await this.productList.count();
    expect(n).toBeGreaterThan(0);
  }

  async verifyProductInfo(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card).toBeVisible({ timeout: 25000 });
    await expect(card.locator("img").first()).toBeVisible();
    const text = (await card.textContent()) ?? "";
    expect(text.length).toBeGreaterThan(3);
    expect(text).toMatch(/\d{1,3}(,\d{3})*\s*원|\d+\s*원|%/);
  }

  /** FEATURE_검색_026: 썸네일 이미지 */
  async verifyProductImage(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card.locator("img").first()).toBeVisible({ timeout: 20000 });
  }

  /** FEATURE_검색_027~028: 카드 내 텍스트(브랜드·상품명 구분 없이 상품 정보 노출) */
  async verifyProductTitles(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card).toBeVisible({ timeout: 20000 });
    const t = (await card.innerText()).replace(/\s+/g, " ").trim();
    expect(t.length).toBeGreaterThan(5);
  }

  /** FEATURE_검색_029: 가격(원) 표기 */
  async verifyProductPrice(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card.getByText(/\d{1,3}(,\d{3})*\s*원|\d+\s*원/)).toBeVisible({
      timeout: 15000,
    });
  }

  /** FEATURE_검색_030: 할인·정가·쿠폰 등 추가 가격 정보(상위 몇 개에서 탐색) */
  async verifyProductPriceExtra(productIndex: number = 0): Promise<void> {
    await expect(this.productList.first()).toBeVisible({ timeout: 25000 });
    const n = await this.productList.count();
    const tryIndices = [productIndex, 0, 1, 2, 3].filter(
      (i, j, a) => a.indexOf(i) === j && i < n,
    );
    for (const i of tryIndices) {
      const card = this.productList.nth(i);
      const text = (await card.innerText()) ?? "";
      if (/%|할인|정가|쿠폰|최대|적립|무료배송/.test(text)) {
        return;
      }
      /** 이미지 영역 링크에 data-discount-rate 등이 붙는 경우가 많음 */
      const productLink = card.locator('a[href*="/products/"]').first();
      const rate = await productLink.getAttribute("data-discount-rate");
      const original = await productLink.getAttribute("data-original-price");
      const price = await productLink.getAttribute("data-price");
      if (rate && rate !== "0") return;
      if (original && price && original !== price) return;
    }
    throw new Error("추가 가격·혜택 정보를 찾지 못했습니다.");
  }

  /** FEATURE_검색_031: 정렬·필터 영역(검색 옵션) 노출 */
  async verifySortOrFilterBar(): Promise<void> {
    await expect(
      this.page
        .locator("main")
        .getByText(/정렬|추천순|인기순|판매순|신상품|낮은가격|필터/)
        .first(),
    ).toBeVisible({ timeout: 20000 });
  }

  /** FEATURE_검색_032: 카테고리·속성 관련 필터 UI */
  async verifyCategoryChips(): Promise<void> {
    await expect(
      this.page
        .locator("main")
        .getByText(/카테고리|의류|상의|하의|아우터|신발|가방|전체/)
        .first(),
    ).toBeVisible({ timeout: 20000 });
  }

  /** FEATURE_검색_033: 검색 결과 리스트 컨테이너 */
  async verifyResultListContainer(): Promise<void> {
    const main = this.page.locator("main").first();
    await expect(main).toBeVisible();
    await expect(this.productList.first()).toBeVisible({ timeout: 25000 });
  }

  async clickBrandFilter(): Promise<void> {
    const btn = this.page.getByRole("button", { name: /브랜드/ }).first();
    await expect(btn).toBeVisible({ timeout: 20000 });
    await btn.click();
  }

  async selectBrand(brandName: string): Promise<void> {
    const brandCheckbox = this.page
      .locator(`text=${brandName}`)
      .locator("..")
      .locator('input[type="checkbox"]');
    await expect(brandCheckbox).toBeVisible();
    await brandCheckbox.click();
  }

  async clickLikeButton(productIndex: number = 0): Promise<void> {
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible();
    await likeButton.click();
  }

  async verifyLikeButtonActive(productIndex: number = 0): Promise<void> {
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toHaveClass(/active|liked|selected|on/i);
  }
}
