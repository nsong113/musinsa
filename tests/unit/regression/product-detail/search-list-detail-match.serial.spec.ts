import { test, expect } from "@/fixtures/index";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { MainPage } from "@/pages/Main.page";
import { ProductDetailPage } from "@/pages/ProductDetail.page";
import { ProductListPage } from "@/pages/ProductList.page";
import { SEARCH_KEYWORD } from "@/data/general";
import type { ProductListCardSnapshot } from "@/types/product-snapshot";
import {
  brandSlugFromHref,
  priceDiscountSetsOverlap,
  productNamesConsistent,
} from "@/util/product-compare";
import { assertSearch045Completed } from "@/util/search-045-state";

/**
 * 전제: 검색_019까지와 동일하게 메인 → 검색어 검색 → 상품 탭 결과
 * 그룹: 검색 리스트 ↔ 상세 일치 (045~049)
 */
test.describe("Product · 검색 리스트-상세 일치 (045~049)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  let snapshot: ProductListCardSnapshot;

  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    const header = new HeaderComponent(page);
    const productList = new ProductListPage(page);
    await mainPage.goToMain();
    await header.search(SEARCH_KEYWORD, "main");
    snapshot = await productList.getListCardSnapshot(0);
    expect(snapshot.productId.length).toBeGreaterThan(0);
    await productList.openProductFromList(0);
    const detail = new ProductDetailPage(page);
    await detail.waitForProductDetailLoaded();
  });

  test("FEATURE_상세_045: 상세 아이템이 목록과 동일 상품(동일 product id)", async ({
    page,
  }) => {
    await assertSearch045Completed(page, snapshot);
  });

  test("FEATURE_상세_046: 브랜드 일치", async ({ page }) => {
    const listSlug = brandSlugFromHref(snapshot.brandHref);
    expect(listSlug.length, "목록 카드에 브랜드 식별자 필요").toBeGreaterThan(0);
    await expect(
      page.locator(`a[href*="/brand/${listSlug}"]`).first(),
      `목록 브랜드 경로가 상세에도 있어야 함: ${snapshot.brandHref}`,
    ).toBeVisible({ timeout: 20000 });
  });

  test("FEATURE_상세_047: 아이템 이름 일치", async ({ page }) => {
    const detail = new ProductDetailPage(page);
    const d = await detail.getProductTitle();
    const list = snapshot.productName;
    const raw = snapshot.rawCardText;
    const compact = (s: string) => s.replace(/\s+/g, "").toLowerCase();
    const loose =
      list.length >= 8 &&
      compact(d).includes(compact(list).slice(0, Math.min(14, compact(list).length)));
    const tokens = (s: string) =>
      [
        ...new Set(
          s
            .toLowerCase()
            .split(/[^a-z0-9가-힣]+/)
            .filter((w) => w.length > 3),
        ),
      ];
    const overlap = tokens(d).filter((w) => tokens(raw).includes(w)).length;
    const embedded = overlap >= 3;
    expect(
      productNamesConsistent(list, d) || loose || embedded,
      `목록="${list}" raw="${raw.slice(0, 160)}" 상세="${d}"`,
    ).toBe(true);
  });

  test("FEATURE_상세_048: 가격·할인율 일치", async ({ page }) => {
    const detail = new ProductDetailPage(page);
    const detailText = await detail.getPriceAreaText();
    const { ok, listAmounts, detailAmounts } = priceDiscountSetsOverlap(
      snapshot.rawCardText,
      detailText,
    );
    expect(
      ok,
      `목록 금액 ${listAmounts.join(",")} / 상세 ${detailAmounts.join(",")} — detail: ${detailText.slice(0, 400)}`,
    ).toBe(true);
  });

  test("FEATURE_상세_049: 상세 대표 이미지 노출", async ({ page }) => {
    const detail = new ProductDetailPage(page);
    await detail.verifyMainProductImageVisible();
  });
});
