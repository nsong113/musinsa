import { test, expect } from "@/fixtures/index";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { MainPage } from "@/pages/Main.page";
import { SearchResultPage } from "@/pages/SearchResult.page";
import { SEARCH_KEYWORD } from "@/data/general";

/**
 * Search Test Suite
 * CSV TestCase: FEATURE_검색_013~044
 *
 * Arrange-Act-Assert 패턴:
 * - Arrange: 테스트 환경 준비 (페이지 객체 생성, 초기 상태 설정)
 * - Act: Page Object의 메서드 호출 (사용자 액션)
 * - Assert: 비즈니스 요구사항 검증 (테스트 목적에 맞는 검증)
 */

test.describe("Search", () => {
  let header: HeaderComponent;
  let mainPage: MainPage;
  let searchResultPage: SearchResultPage;

  test.beforeEach(async ({ page }) => {
    // Arrange - 테스트 환경 준비
    mainPage = new MainPage(page);
    header = new HeaderComponent(page);
    searchResultPage = new SearchResultPage(page);

    await mainPage.goToMain();
  });

  test("FEATURE_검색_013: 헤더 검색창이 존재한다", async ({ page }) => {
    // Act - 검색창 확인 (이미 HeaderComponent에 구현됨)
    // Assert - 비즈니스 요구사항: 검색창이 보여야 함
    await expect(header.searchInput).toBeVisible();
  });

  test("FEATURE_검색_014: 검색창 포커스 시 검색어 입력 탭이 나타난다", async ({
    page,
  }) => {
    // Act - 검색창 클릭 (포커스)
    await header.focusSearchInput("main");

    // Assert - 검색어 입력 탭이 나타나야 함
    await expect(header.searchTabInput).toBeVisible();
    await expect(header.searchTabBtn).toBeVisible();
    await expect(header.searchTabRecommend).toBeVisible();
  });

  test("FEATURE_검색_015: 인기 검색어가 나타난다", async ({ page }) => {
    // Act
    await header.focusSearchInput("main");
    await header.verifySearchTabOpened(); // ? spec에서 어설트한 메서드를 사용해도 됨?

    // Assert - 인기 검색어가 보여야 함
    await expect(header.searchTabRecommend).toBeVisible();
  });

  test("FEATURE_검색_017~019: 검색어 입력 및 검색 실행", async ({ page }) => {
    // Act - 검색 실행 (HeaderComponent의 search 메서드 사용)
    await header.search(SEARCH_KEYWORD, "main");

    // Assert - URL이 검색 결과 페이지로 변경되었는지 확인

    //하위에 연관 검색어 존재하는지 확인*****
    ///////////////////////////////////
    ///////////////////////////////////
    const encodedKeyword = encodeURIComponent(SEARCH_KEYWORD);
    await expect(page).toHaveURL(
      new RegExp(`.*keyword=${encodedKeyword}.*`)
    );
  });

  ///////////////////////////////////
  ///////////////////////////////////
  ///////////////////////////////////
  ///////////////////////////////////
  ///////////////////////////////////
  ///////////////////////////////////

  //   test("FEATURE_검색_020: 연관검색어가 존재한다", async ({ page }) => {
  //     // Arrange
  //     const mainPage = new MainPage(page);
  //     const header = new HeaderComponent(page);
  //     const searchResultPage = new SearchResultPage(page);
  //     await mainPage.goToMain();
  //     await header.search(SEARCH_KEYWORD, "main");

  //     // Act - 연관검색어 확인 (Page Object 메서드 사용)
  //     // Assert - 연관검색어가 보여야 함
  //     await searchResultPage.verifyRelatedKeywords();
  //   });

  //   test("FEATURE_검색_022: 검색 탭이 나타난다", async ({ page }) => {
  //     // Arrange
  //     const mainPage = new MainPage(page);
  //     const header = new HeaderComponent(page);
  //     const searchResultPage = new SearchResultPage(page);
  //     await mainPage.goToMain();
  //     await header.search(SEARCH_KEYWORD);

  //     // Act & Assert - 검색 탭 확인
  //     await searchResultPage.verifySearchTabs();
  //   });

  //   test("FEATURE_검색_024: 전체 상품 갯수가 1 이상이다", async ({ page }) => {
  //     // Arrange
  //     const mainPage = new MainPage(page);
  //     const header = new HeaderComponent(page);
  //     const searchResultPage = new SearchResultPage(page);
  //     await mainPage.goToMain();
  //     await header.search(SEARCH_KEYWORD);

  //     // Act & Assert - 전체 상품 갯수 확인
  //     await searchResultPage.verifyTotalProductCount();
  //   });

  //   test("FEATURE_검색_025: 검색 결과 상품이 '니트' 종류이다", async ({
  //     page,
  //   }) => {
  //     // Arrange
  //     const mainPage = new MainPage(page);
  //     const header = new HeaderComponent(page);
  //     const searchResultPage = new SearchResultPage(page);
  //     await mainPage.goToMain();
  //     await header.search(SEARCH_KEYWORD);

  //     // Act - 상품 리스트 확인
  //     await searchResultPage.verifyProductList();

  //     // Assert - 첫 번째 상품이 '니트'를 포함하는지 확인 (비즈니스 검증)
  //     const firstProduct = searchResultPage.productList.first();
  //     const productName = await firstProduct.textContent();
  //     expect(productName?.toLowerCase()).toContain(SEARCH_KEYWORD.toLowerCase());
  //   });

  //   test("FEATURE_검색_026~030: 상품 정보가 노출된다", async ({ page }) => {
  //     // Arrange
  //     const mainPage = new MainPage(page);
  //     const header = new HeaderComponent(page);
  //     const searchResultPage = new SearchResultPage(page);
  //     await mainPage.goToMain();
  //     await header.search(SEARCH_KEYWORD);

  //     // Act & Assert - 상품 정보 확인
  //     await searchResultPage.verifyProductInfo(0);
  //   });

  //   test("FEATURE_검색_034: 브랜드 필터 클릭 시 필터 모달이 열린다", async ({
  //     page,
  //   }) => {
  //     // Arrange
  //     const mainPage = new MainPage(page);
  //     const header = new HeaderComponent(page);
  //     const searchResultPage = new SearchResultPage(page);
  //     await mainPage.goToMain();
  //     await header.search(SEARCH_KEYWORD);

  //     // Act - 브랜드 필터 클릭
  //     await searchResultPage.clickBrandFilter();

  //     // Assert - 필터 모달이 열렸는지 확인 (비즈니스 검증)
  //     // 실제 모달 locator는 페이지 구조에 맞게 수정 필요
  //     await expect(
  //       page.locator('[role="dialog"]').or(page.locator(".modal"))
  //     ).toBeVisible();
  //   });

  //   test("FEATURE_검색_044: 좋아요 버튼 클릭 시 빨간 하트로 변한다", async ({
  //     page,
  //   }) => {
  //     // Arrange
  //     const mainPage = new MainPage(page);
  //     const header = new HeaderComponent(page);
  //     const searchResultPage = new SearchResultPage(page);
  //     await mainPage.goToMain();
  //     await header.search(SEARCH_KEYWORD);

  //     // Act - 좋아요 버튼 클릭
  //     await searchResultPage.clickLikeButton(0);

  //     // Assert - 좋아요 버튼이 활성화되었는지 확인
  //     await searchResultPage.verifyLikeButtonActive(0);
  //   });
});
