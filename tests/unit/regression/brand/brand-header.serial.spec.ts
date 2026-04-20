import type { Page } from "@playwright/test";
import { test, expect } from "@/fixtures/index";
import { BrandPage } from "@/pages/Brand.page";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { MainPage } from "@/pages/Main.page";
import { ProductListPage } from "@/pages/ProductList.page";
import { SearchResultPage } from "@/pages/SearchResult.page";
import {
  BRAND_FILTER_MUSINSA_STANDARD,
  BRAND_PRODUCT_SEARCH_KEYWORD,
  SEARCH_KEYWORD,
} from "@/data/general";

/**
 * 전제: 검색_042까지 완료(브랜드 필터 PLP) 후 브랜드 숍 헤더 검증
 * 그룹: 브랜드 페이지 · 헤더 (050~055)
 */
test.describe("Brand · 브랜드 숍 헤더 (050~055)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  let sharedPage: Page;
  let chainSearchResult: SearchResultPage;
  let chainProductList: ProductListPage;
  let brandPage: BrandPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "https://www.musinsa.com",
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      geolocation: { longitude: 126.978, latitude: 37.5665 },
      extraHTTPHeaders: {
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      storageState: "tests/fixtures/storage/authed.json",
    });
    sharedPage = await context.newPage();
    const chainMain = new MainPage(sharedPage);
    const chainHeader = new HeaderComponent(sharedPage);
    chainSearchResult = new SearchResultPage(sharedPage);
    chainProductList = new ProductListPage(sharedPage);
    brandPage = new BrandPage(sharedPage);

    await chainMain.goToMain();
    await chainHeader.search(SEARCH_KEYWORD, "main");

    const n = await chainSearchResult.getTotalProductCountFromMain();
    await chainSearchResult.clickBrandFilter();
    await chainSearchResult.selectBrand(BRAND_FILTER_MUSINSA_STANDARD);
    await chainSearchResult.verifyBrandChipVisible(BRAND_FILTER_MUSINSA_STANDARD);
    const s = await chainSearchResult.getBrandFilterSelectionCount(n);
    await chainSearchResult.verifyViewProductsControlVisible(s);
    await chainSearchResult.clickViewProductsForCount(s);
    await chainProductList.verifyProductCardCountEquals(s);
    await chainProductList.verifyAllProductCardsBrandMusinsaStandard();
    await chainProductList.verifyProductNamesContainKeywordAtLeast(SEARCH_KEYWORD, 0.8);

    await brandPage.gotoMusinsaStandardBrand();
  });

  test.afterAll(async () => {
    await sharedPage?.context().close();
  });

  /**
   * 구 스펙: /brand 신규 탭 — 현재 musinsa.com/brand 는 404이며,
   * 브랜드숍 헤더 로고는 동일 탭에서 브랜드 홈(/brand/musinsastandard)을 유지한다.
   */
  test("FEATURE_브랜드_050: 브랜드숍 로고(브랜드 영역) 클릭 시 브랜드 홈 유지", async () => {
    await brandPage.brandShopLogoHome.click();
    await expect(sharedPage).toHaveURL(/\/brand\/musinsastandard/);
    expect(sharedPage.context().pages().length).toBe(1);
  });

  test("FEATURE_브랜드_051: 헤더 서브타이틀 MUSINSA STANDARD 노출", async () => {
    await expect(brandPage.subTitleMusinsaStandard.first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("FEATURE_브랜드_052: 헤더 메인 타이틀·국가 표시 노출", async () => {
    await expect(brandPage.mainTitleMusinsaStandard).toBeVisible({
      timeout: 20000,
    });
    await expect(brandPage.countryOrRegionLine.first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("FEATURE_브랜드_053: 브랜드 상품 검색 클릭 시 검색 탭(레이어) 노출", async () => {
    await brandPage.openBrandProductSearchLayer();
    await brandPage.verifyBrandProductSearchLayerOpen();
    await sharedPage.keyboard.press("Escape");
  });

  test("FEATURE_브랜드_054: 브랜드 상품 검색어 입력", async () => {
    await brandPage.openBrandProductSearchLayer();
    await brandPage.brandProductSearchInput.fill(BRAND_PRODUCT_SEARCH_KEYWORD);
    await expect(brandPage.brandProductSearchInput).toHaveValue(
      BRAND_PRODUCT_SEARCH_KEYWORD,
    );
  });

  test("FEATURE_브랜드_055: 검색 시 브랜드 상품 목록 URL(키워드=바지)", async () => {
    await brandPage.brandProductSearchSubmit.click();
    await expect(sharedPage).toHaveURL(/\/brand\/musinsastandard\/products/);
    const u = new URL(sharedPage.url());
    expect(u.searchParams.get("keyword")).toBe(BRAND_PRODUCT_SEARCH_KEYWORD);
  });
});
