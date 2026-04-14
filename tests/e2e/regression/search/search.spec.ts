import type { Page } from "@playwright/test";
import { test, expect } from "@/fixtures/index";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { LikePage } from "@/pages/Like.page";
import { MainPage } from "@/pages/Main.page";
import { ProductListPage } from "@/pages/ProductList.page";
import { SearchResultPage } from "@/pages/SearchResult.page";
import { BRAND_FILTER_MUSINSA_STANDARD, SEARCH_KEYWORD } from "@/data/general";

async function searchKeyword(header: HeaderComponent): Promise<void> {
  await header.search(SEARCH_KEYWORD, "main");
}

test.describe("Search", () => {
  let header: HeaderComponent;
  let mainPage: MainPage;
  let searchResultPage: SearchResultPage;
  let productListPage: ProductListPage;
  let likePage: LikePage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    header = new HeaderComponent(page);
    searchResultPage = new SearchResultPage(page);
    productListPage = new ProductListPage(page);
    likePage = new LikePage(page);
    await mainPage.goToMain();
  });

  test.describe("헤더 검색창", () => {
    test("FEATURE_검색_013: 헤더 검색창이 존재한다", async () => {
      await expect(header.searchInput).toBeVisible();
    });

    test("FEATURE_검색_014: 검색창 포커스 시 검색어 입력 탭이 나타난다", async () => {
      await header.focusSearchInput("main");
      await expect(header.searchTabInput).toBeVisible();
      await expect(header.searchTabBtn).toBeVisible();
      await expect(header.searchTabRecommend).toBeVisible();
    });

    test("FEATURE_검색_015: 인기 검색어가 나타난다", async () => {
      await header.focusSearchInput("main");
      await header.verifySearchTabOpened();
      await expect(header.searchTabRecommend).toBeVisible();
    });
  });

  test.describe("검색 실행", () => {
    test("FEATURE_검색_017~019: 검색어 입력 및 검색 실행", async ({ page }) => {
      await header.search(SEARCH_KEYWORD, "main");
      const encodedKeyword = encodeURIComponent(SEARCH_KEYWORD);
      await expect(page).toHaveURL(new RegExp(`.*keyword=${encodedKeyword}.*`));
    });
  });

  test.describe("검색 결과 페이지", () => {
    test.beforeEach(async () => {
      await searchKeyword(header);
    });

    test.describe("연관 검색어", () => {
      test("FEATURE_검색_020: 연관검색어가 존재한다", async () => {
        await searchResultPage.verifyRelatedKeywords();
      });

      test("FEATURE_검색_021: 연관검색어 클릭 시 화면이 갱신된다", async ({
        page,
      }) => {
        const before = page.url();
        await searchResultPage.clickFirstRelatedKeyword();
        expect(page.url()).not.toBe(before);
      });
    });

    test.describe("검색 탭·내비게이션", () => {
      test("FEATURE_검색_022: 검색 탭이 나타난다", async () => {
        await searchResultPage.verifySearchTabs();
      });

      test("FEATURE_검색_023: 기본 상품 탭이 노출된다", async () => {
        await searchResultPage.verifyDefaultProductTab();
      });
    });

    test.describe("검색 건수", () => {
      test("FEATURE_검색_024: 전체 상품 갯수가 1 이상이다", async () => {
        await searchResultPage.verifyTotalProductCount();
      });
    });

    test.describe("상품 목록·키워드", () => {
      test("FEATURE_검색_025: 검색 결과 상품이 '니트' 종류이다", async () => {
        await productListPage.verifyProductList();
        const knitPattern = /니트|knitwear|knit/i;
        const max = Math.min(await productListPage.productList.count(), 16);
        let found = false;
        for (let i = 0; i < max; i++) {
          const raw =
            (await productListPage.productList.nth(i).textContent()) ?? "";
          if (knitPattern.test(raw)) {
            found = true;
            break;
          }
        }
        expect(found).toBe(true);
      });
    });

    test.describe("상품 카드", () => {
      test("FEATURE_검색_026: 상품 썸네일 이미지가 노출된다", async () => {
        await productListPage.verifyProductImage(0);
      });

      test("FEATURE_검색_027: 상품 정보 텍스트가 노출된다", async () => {
        await productListPage.verifyProductTitles(0);
      });

      test("FEATURE_검색_028: 상품명이 노출된다", async () => {
        await productListPage.verifyProductTitles(0);
      });

      test("FEATURE_검색_029: 가격이 노출된다", async () => {
        await productListPage.verifyProductPrice(0);
      });

      test("FEATURE_검색_030: 할인·혜택 등 추가 가격 정보가 노출된다", async () => {
        await productListPage.verifyProductPriceExtra(0);
      });
    });

    test.describe("정렬·필터·결과 영역", () => {
      test("FEATURE_검색_031: 정렬·필터 영역이 노출된다", async () => {
        await searchResultPage.verifySortOrFilterBar();
      });

      test("FEATURE_검색_032: 카테고리·속성 필터가 노출된다", async () => {
        await searchResultPage.verifyCategoryChips();
      });

      test("FEATURE_검색_033: 검색 결과 리스트가 노출된다", async () => {
        await productListPage.verifyResultListContainer();
      });
    });

    test.describe("브랜드 필터", () => {
      test("FEATURE_검색_034: 브랜드 필터 클릭 시 필터 모달이 열린다", async ({
        page,
      }) => {
        await searchResultPage.clickBrandFilter();
        await expect(
          page
            .getByRole("dialog")
            .or(page.locator('[aria-modal="true"]'))
            .first(),
        ).toBeVisible({ timeout: 15000 });
      });
    });
  });
});

/**
 * `검색 결과 페이지`의 beforeEach(search)와 상태 공유가 맞지 않아 Search 밖에서 시리얼 실행.
 * 리포트 상 그룹명: Search · 브랜드 필터 무신사 스탠다드 (035~044)
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
    await chainSearchResult.verifyBrandChipVisible(
      BRAND_FILTER_MUSINSA_STANDARD,
    );
  });

  test("FEATURE_검색_036: 필터 선택 건수 s", async () => {
    s = await chainSearchResult.getBrandFilterSelectionCount(n);
  });

  test("FEATURE_검색_037: [s개의 상품 보기] 노출", async () => {
    await expect(chainSearchResult.viewProductsButton(s)).toBeVisible({
      timeout: 15000,
    });
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
    await chainProductList.verifyProductNamesContainKeywordAtLeast(
      SEARCH_KEYWORD,
      0.8,
    );
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
