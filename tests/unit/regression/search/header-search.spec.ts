import { test, expect } from "@/fixtures/index";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { MainPage } from "@/pages/Main.page";
import { SEARCH_KEYWORD } from "@/data/general";

test.describe("Search · 헤더 검색창 (013~015, 017~019)", () => {
  let header: HeaderComponent;
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    header = new HeaderComponent(page);
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
});

