import { test, expect } from "@/fixtures/index";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { MainPage } from "@/pages/Main.page";
import { SearchResultPage } from "@/pages/SearchResult.page";
import { SEARCH_KEYWORD } from "@/data/general";

/**
 * Search Test Suite
 * CSV TestCase: FEATURE_검색_013~044
 */

test.describe("Search", () => {
  let header: HeaderComponent;
  let mainPage: MainPage;
  let searchResultPage: SearchResultPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    header = new HeaderComponent(page);
    searchResultPage = new SearchResultPage(page);
    await mainPage.goToMain();
  });

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

  test("FEATURE_검색_017~019: 검색어 입력 및 검색 실행", async ({ page }) => {
    await header.search(SEARCH_KEYWORD, "main");
    const encodedKeyword = encodeURIComponent(SEARCH_KEYWORD);
    await expect(page).toHaveURL(new RegExp(`.*keyword=${encodedKeyword}.*`));
  });

  test.describe("검색 결과 페이지", () => {
    test.beforeEach(async () => {
      await header.search(SEARCH_KEYWORD, "main");
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
        await searchResultPage.verifyProductList();
        const firstProduct = searchResultPage.productList.first();
        const productName = await firstProduct.textContent();
        expect(productName?.toLowerCase()).toContain(
          SEARCH_KEYWORD.toLowerCase(),
        );
      });
    });

    test.describe("상품 카드", () => {
      test("FEATURE_검색_026: 상품 썸네일 이미지가 노출된다", async () => {
        await searchResultPage.verifyProductImage(0);
      });

      test("FEATURE_검색_027: 상품 정보 텍스트가 노출된다", async () => {
        await searchResultPage.verifyProductTitles(0);
      });

      test("FEATURE_검색_028: 상품명이 노출된다", async () => {
        await searchResultPage.verifyProductTitles(0);
      });

      test("FEATURE_검색_029: 가격이 노출된다", async () => {
        await searchResultPage.verifyProductPrice(0);
      });

      test("FEATURE_검색_030: 할인·혜택 등 추가 가격 정보가 노출된다", async () => {
        await searchResultPage.verifyProductPriceExtra(0);
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
        await searchResultPage.verifyResultListContainer();
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

  test.describe("검색 결과 좋아요", () => {
    test.beforeEach(async () => {
      await header.search(SEARCH_KEYWORD, "main");
    });

    test("FEATURE_검색_044: 좋아요 버튼 클릭 시 빨간 하트로 변한다", async () => {
      await searchResultPage.clickLikeButton(0);
      await searchResultPage.verifyLikeButtonActive(0);
    });
  });
});
