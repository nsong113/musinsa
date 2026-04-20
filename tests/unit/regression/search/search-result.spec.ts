import { test, expect } from "@/fixtures/index";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { LikePage } from "@/pages/Like.page";
import { MainPage } from "@/pages/Main.page";
import { ProductListPage } from "@/pages/ProductList.page";
import { SearchResultPage } from "@/pages/SearchResult.page";
import { SEARCH_KEYWORD } from "@/data/general";
import { searchKeyword } from "./_helpers";

test.describe("Search · 검색 결과 페이지 (020~034)", () => {
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
    await searchKeyword(header);
  });

  test.describe("연관 검색어", () => {
    test("FEATURE_검색_020: 연관검색어가 존재한다", async () => {
      await searchResultPage.verifyRelatedKeywords();
    });

    test("FEATURE_검색_021: 연관검색어 클릭 시 화면이 갱신된다", async ({ page }) => {
      const before = page.url();
      await productListPage.verifyProductList();
      const beforeFirstHref =
        (await productListPage.productList
          .first()
          .locator('a[href*="/products/"]')
          .first()
          .getAttribute("href")) ?? "";

      await searchResultPage.clickFirstRelatedKeyword();

      // URL은 SPA 갱신으로 유지될 수 있어, 상품 결과가 바뀌는지로 검증
      await productListPage.verifyProductList();
      const afterFirstHref =
        (await productListPage.productList
          .first()
          .locator('a[href*="/products/"]')
          .first()
          .getAttribute("href")) ?? "";

      expect.soft(page.url()).not.toBe(before);
      expect(afterFirstHref).not.toBe(beforeFirstHref);
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
        const raw = (await productListPage.productList.nth(i).textContent()) ?? "";
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
    test("FEATURE_검색_034: 브랜드 필터 클릭 시 필터 모달이 열린다", async ({ page }) => {
      await searchResultPage.clickBrandFilter();
      // 브랜드 필터는 UI에 따라 모달/인라인으로 열릴 수 있음
      await searchResultPage.verifyBrandFilterPanelOpened();
    });
  });
});

