import type { Page } from "@playwright/test";
import { test, expect } from "@/fixtures/index";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { LikePage } from "@/pages/Like.page";
import { MainPage } from "@/pages/Main.page";
import { ProductListPage } from "@/pages/ProductList.page";
import { SearchResultPage } from "@/pages/SearchResult.page";
import { BRAND_FILTER_MUSINSA_STANDARD, SEARCH_KEYWORD } from "@/data/general";

/**
 * 그룹명: Search · 브랜드 필터 무신사 스탠다드 (035~044)
 */
test.describe("Search · 브랜드 필터 무신사 스탠다드 (035~044)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  let sharedPage: Page;
  let chainHeader: HeaderComponent;
  let chainMain: MainPage;
  let chainSearchResult: SearchResultPage;
  let chainProductList: ProductListPage;
  let chainLike: LikePage;
  let n = 0;
  let s = 0;

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
    chainMain = new MainPage(sharedPage);
    chainHeader = new HeaderComponent(sharedPage);
    chainSearchResult = new SearchResultPage(sharedPage);
    chainProductList = new ProductListPage(sharedPage);
    chainLike = new LikePage(sharedPage);
    await chainMain.goToMain();
    await chainHeader.search(SEARCH_KEYWORD, "main");
  });

  test.afterAll(async () => {
    await sharedPage?.context().close();
  });

  test("FEATURE_검색_035: 무신사 스탠다드 선택·상단 노출", async () => {
    n = await chainSearchResult.getTotalProductCountFromMain();
    await chainSearchResult.clickBrandFilter();
    await chainSearchResult.selectBrand(BRAND_FILTER_MUSINSA_STANDARD);
    await chainSearchResult.verifyBrandChipVisible(BRAND_FILTER_MUSINSA_STANDARD);
  });

  test("FEATURE_검색_036: 필터 선택 건수 s", async () => {
    s = await chainSearchResult.getBrandFilterSelectionCount(n);
  });

  test("FEATURE_검색_037: [s개의 상품 보기] 노출", async () => {
    await chainSearchResult.verifyViewProductsControlVisible(s);
  });

  test("FEATURE_검색_038: n >= s", async () => {
    expect(n).toBeGreaterThanOrEqual(s);
  });

  test("FEATURE_검색_039: s개 상품 보기 클릭", async () => {
    await chainSearchResult.clickViewProductsForCount(s);
  });

  test("FEATURE_검색_040: 목록 개수 s", async () => {
    await chainProductList.verifyProductCardCountEquals(s);
  });

  test("FEATURE_검색_041: 브랜드 일치", async () => {
    await chainProductList.verifyAllProductCardsBrandMusinsaStandard();
  });

  test("FEATURE_검색_042: 상품명 80% 이상 니트 포함", async () => {
    await chainProductList.verifyProductNamesContainKeywordAtLeast(SEARCH_KEYWORD, 0.8);
  });

  test("FEATURE_검색_043: 하트 아이콘 존재", async () => {
    await expect(chainLike.likeButtons.first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("FEATURE_검색_044: 좋아요 활성", async () => {
    await chainLike.clickLikeButton(0);
    await chainLike.verifyLikeButtonActive(0);
    await chainLike.deactivateLikeAt(0);
  });
});

