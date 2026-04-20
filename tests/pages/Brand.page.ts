import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "@/pages/Base.page";

/**
 * 브랜드 숍 홈·헤더 (/brand/:slug, 예: musinsastandard)
 */
export class BrandPage extends BasePage {
  /** 브랜드숍 상단 로고 — aria 무신사 스탠다드 브랜드숍 홈으로 이동 */
  readonly brandShopLogoHome: Locator;
  /** 프로필 영역 서브타이틀 */
  readonly subTitleMusinsaStandard: Locator;
  /** 프로필 영역 메인 타이틀(영문 블록 내) */
  readonly mainTitleMusinsaStandard: Locator;
  /** 국가 표시(텍스트·국기 대신 '한국' 문구 등) */
  readonly countryOrRegionLine: Locator;
  /** 본문 '브랜드 상품 검색' 진입 버튼 */
  readonly brandProductSearchToggle: Locator;
  readonly brandProductSearchInput: Locator;
  /** 레이어 내 검색 실행(aria-label=검색 — 전역 헤더 검색과 구분) */
  readonly brandProductSearchSubmit: Locator;

  constructor(page: Page) {
    super(page);
    this.brandShopLogoHome = page.getByRole("button", {
      name: /브랜드숍 홈으로 이동/,
    });
    this.subTitleMusinsaStandard = page
      .locator("main")
      .getByText("MUSINSA STANDARD", { exact: true });
    this.mainTitleMusinsaStandard = page
      .locator("main")
      .getByText("무신사 스탠다드", { exact: true })
      .first();
    this.countryOrRegionLine = page.locator("main").getByText(/한국/);
    this.brandProductSearchToggle = page.getByRole("button", {
      name: /브랜드 상품 검색/,
    });
    this.brandProductSearchInput = page.getByPlaceholder("검색어를 입력하세요");
    this.brandProductSearchSubmit = page.locator('button[aria-label="검색"]').last();
  }

  async gotoMusinsaStandardBrand(): Promise<void> {
    await this.page.goto("/brand/musinsastandard?gf=A");
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.mainTitleMusinsaStandard).toBeVisible({ timeout: 45000 });
  }

  /** FEATURE_브랜드_053: 브랜드 상품 검색 레이어 */
  async openBrandProductSearchLayer(): Promise<void> {
    await this.brandProductSearchToggle.click();
    await expect(this.brandProductSearchInput).toBeVisible({ timeout: 15000 });
  }

  async verifyBrandProductSearchLayerOpen(): Promise<void> {
    await expect(this.brandProductSearchInput).toBeVisible();
    /** 브랜드 숍 검색 레이어는 인기 검색어 대신 #TAGS·해시태그 칩을 노출하는 경우가 많음 */
    await expect(
      this.page
        .getByText("#TAGS")
        .or(this.page.getByText(/인기\s*검색어|실시간\s*인기|추천\s*검색어/)),
    ).toBeVisible({ timeout: 15000 });
  }

  async searchBrandProducts(keyword: string): Promise<void> {
    await this.openBrandProductSearchLayer();
    await this.brandProductSearchInput.fill(keyword);
    await this.brandProductSearchSubmit.click();
    await expect(this.page).toHaveURL(/\/brand\/[^/]+\/products/, {
      timeout: 45000,
    });
  }
}
