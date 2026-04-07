import { Page, Locator, expect } from "@playwright/test";

export class SearchResultPage {
  readonly page: Page;

  readonly relatedKeywords: Locator; // 연관검색어 묶음
  readonly relatedKeyword: Locator; // 연관검색어

  readonly searchTabs: Locator; // 검색 탭 (상품, 스냅/코디, 혜택, 콘텐츠, 발매)
  readonly totalProductCount: Locator; // 전체 상품 갯수
  readonly productList: Locator; // 상품 리스트
  readonly brandFilter: Locator; // 브랜드 필터
  readonly likeButtons: Locator; // 좋아요 버튼들

  constructor(page: Page) {
    this.page = page;

    // CSV TestCase 기반 Locator 정의
    // FEATURE_검색_020: 연관검색어
    this.relatedKeywords = page.locator('[data-content-name="연관 검색어"]');
    this.relatedKeyword = this.relatedKeywords.locator("button");

    // // FEATURE_검색_022: 검색 탭
    // this.searchTabs = page
    //   .locator('[role="tab"]')
    //   .filter({ hasText: /상품|스냅|코디|혜택|콘텐츠|발매/ });

    // // FEATURE_검색_024: 전체 상품 갯수
    // this.totalProductCount = page
    //   .locator("text=/전체.*상품.*\\d+/")
    //   .or(page.locator('[data-testid="total-count"]'));

    // // FEATURE_검색_025: 상품 리스트
    // this.productList = page
    //   .locator('[data-testid="product-item"]')
    //   .or(page.locator(".product-item"));

    // // FEATURE_검색_031: 브랜드 필터
    // this.brandFilter = page
    //   .locator("text=브랜드")
    //   .locator("..")
    //   .or(page.locator('[data-testid="brand-filter"]'));

    // // FEATURE_검색_043: 좋아요 버튼
    // this.likeButtons = page
    //   .locator('[data-testid="like-button"]')
    //   .or(page.locator('button[aria-label*="좋아요"]'));
  }

  // Methods - 검색 결과 페이지의 액션들

  //  연관검색어 확인
  //  FEATURE_검색_020, 021

  async verifyRelatedKeywords(search: string): Promise<void> {
    const count = await this.relatedKeyword.count();

    for (let i = 0; i < count; i++) {
      const keyword = this.relatedKeyword.nth(i);
      await expect(keyword).toBeVisible();
      await expect(keyword).toContainText(search);
    }

    await expect(this.relatedKeywords).toBeVisible();
  }

  /**
   * 검색 탭 확인
   * CSV: FEATURE_검색_022
   */
  async verifySearchTabs(): Promise<void> {
    const tabs = ["상품", "스냅/코디", "혜택", "콘텐츠", "발매"];
    for (const tab of tabs) {
      await expect(this.searchTabs.filter({ hasText: tab })).toBeVisible();
    }
  }

  /**
   * 전체 상품 갯수 확인
   * CSV: FEATURE_검색_024
   */
  async verifyTotalProductCount(): Promise<void> {
    await expect(this.totalProductCount).toBeVisible();
    const countText = await this.totalProductCount.textContent();
    const count = parseInt(countText?.match(/\d+/)?.[0] || "0");
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 상품 리스트 확인
   * CSV: FEATURE_검색_025
   */
  async verifyProductList(): Promise<void> {
    await expect(this.productList.first()).toBeVisible();
    const count = await this.productList.count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 상품 정보 확인 (사진, 브랜드, 이름, 가격 등)
   * CSV: FEATURE_검색_026~030
   */
  async verifyProductInfo(productIndex: number = 0): Promise<void> {
    const product = this.productList.nth(productIndex);

    // 상품 사진
    await expect(product.locator("img")).toBeVisible();

    // 브랜드
    await expect(product.locator("text=/브랜드|brand/i")).toBeVisible();

    // 상품 이름
    await expect(product.locator('[data-testid="product-name"]')).toBeVisible();

    // 가격 정보
    await expect(product.locator("text=/\\d+원|할인/i")).toBeVisible();
  }

  /**
   * 브랜드 필터 클릭
   * CSV: FEATURE_검색_034
   */
  async clickBrandFilter(): Promise<void> {
    await expect(this.brandFilter).toBeVisible();
    await this.brandFilter.click();
  }

  /**
   * 브랜드 선택 (예: '무신사 스탠다드')
   * CSV: FEATURE_검색_035
   */
  async selectBrand(brandName: string): Promise<void> {
    const brandCheckbox = this.page
      .locator(`text=${brandName}`)
      .locator("..")
      .locator('input[type="checkbox"]');
    await expect(brandCheckbox).toBeVisible();
    await brandCheckbox.click();
  }

  /**
   * 좋아요 버튼 클릭
   * CSV: FEATURE_검색_044
   */
  async clickLikeButton(productIndex: number = 0): Promise<void> {
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible();
    await likeButton.click();
  }

  /**
   * 좋아요 버튼이 빨간 하트로 변했는지 확인
   * CSV: FEATURE_검색_044
   */
  async verifyLikeButtonActive(productIndex: number = 0): Promise<void> {
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toHaveClass(/active|liked|selected/);
  }
}
