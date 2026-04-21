import type { Page } from "@playwright/test";
import { test, expect } from "@/fixtures/index";
import { SEARCH_KEYWORD } from "@/data/general";
import { HeaderComponent } from "@/pages/components/Header.comp";
import { LikePage } from "@/pages/Like.page";
import { LikesGoodsPage } from "@/pages/LikesGoods.page";
import { MainPage } from "@/pages/Main.page";
import { ProductDetailPage } from "@/pages/ProductDetail.page";
import { ProductListPage } from "@/pages/ProductList.page";
import type { ProductListCardSnapshot } from "@/types/product-snapshot";
import {
  brandSlugFromHref,
  normalizeWs,
  priceDiscountSetsOverlap,
  productNamesConsistent,
} from "@/util/product-compare";
import { assertSearch045Completed } from "@/util/search-045-state";

/**
 * 전제: 검색 PLP에서 본문(`main`) 첫 상품 찜 → 검색_045(상세 진입·동일 id) → 좋아요 목록에서 검증.
 * 그룹: 좋아요(찜) 상품 페이지 일치 (056~061)
 */
test.describe("Likes · 좋아요 상품 목록 (056~061)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  let sharedPage: Page;
  let snapshot: ProductListCardSnapshot;

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

    const mainPage = new MainPage(sharedPage);
    const header = new HeaderComponent(sharedPage);
    const productList = new ProductListPage(sharedPage);
    const detail = new ProductDetailPage(sharedPage);
    const likesGoods = new LikesGoodsPage(sharedPage);

    let likedVisible = false;
    for (let attempt = 0; attempt < 2 && !likedVisible; attempt++) {
      await mainPage.goToMain();
      await header.assertAuthenticatedSession();
      await header.search(SEARCH_KEYWORD, "main");
      snapshot = await productList.getListCardSnapshot(0);
      expect(snapshot.productId.length).toBeGreaterThan(0);

      const plpHeart = sharedPage.locator("main").getByRole("button", { name: /좋아요/ }).first();
      await plpHeart.scrollIntoViewIfNeeded();
      await plpHeart.click({ force: true });
      await sharedPage.waitForTimeout(2500);
      await sharedPage.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

      await productList.openProductFromList(0);
      await detail.waitForProductDetailLoaded();
      await assertSearch045Completed(sharedPage, snapshot);

      await likesGoods.gotoLikesGoods();
      await likesGoods.openProductLikesTab();
      const liked = likesGoods.productLinkById(snapshot.productId);
      try {
        await expect(liked).toBeVisible({ timeout: 75_000 });
        likedVisible = true;
      } catch {
        await header.assertAuthenticatedSession();
      }
    }
    expect(likedVisible, "좋아요 목록에 검색에서 찜한 상품이 보여야 함").toBe(true);
  }, { timeout: 300_000 });

  test.afterAll(async () => {
    if (!sharedPage) return;
    try {
      const likesGoods = new LikesGoodsPage(sharedPage);
      const likePage = new LikePage(sharedPage);
      await likesGoods.gotoLikesGoods();
      await likesGoods.openProductLikesTab();
      if (snapshot?.productId?.length) {
        await likePage.deactivateLikeIfActive(
          likesGoods.likeButtonForProduct(snapshot.productId),
        );
      }
    } catch {
      // beforeAll 실패·레이아웃 변경 시에도 컨텍스트는 닫는다
    }
    await sharedPage.context().close();
  }, { timeout: 120_000 });

  test("FEATURE_좋아요_056: 목록에 상품이 1개 이상 있다", async () => {
    const likesGoods = new LikesGoodsPage(sharedPage);
    await likesGoods.verifyAtLeastOneProductCard();
  });

  test("FEATURE_좋아요_057: 상품 아이템에 좋아요 하트 컨트롤이 있다", async () => {
    const likesGoods = new LikesGoodsPage(sharedPage);
    await likesGoods.verifyLikeHeartControlOnProduct(snapshot.productId);
  });

  test("FEATURE_좋아요_058: 검색에서 좋아요한 상품이 좋아요 탭에 노출된다", async () => {
    const likesGoods = new LikesGoodsPage(sharedPage);
    await expect(likesGoods.productLinkById(snapshot.productId)).toBeVisible({
      timeout: 30000,
    });
  });

  test("FEATURE_좋아요_059: 브랜드명이 목록과 동일하다", async () => {
    const likesGoods = new LikesGoodsPage(sharedPage);
    const row = await likesGoods.getLikedRowSnapshot(snapshot.productId);
    const listSlug = brandSlugFromHref(snapshot.brandHref);
    const likedSlug = brandSlugFromHref(row.brandHref);
    expect(listSlug.length, "목록 브랜드 slug").toBeGreaterThan(0);
    expect(
      likedSlug === listSlug ||
        normalizeWs(row.brandText) === normalizeWs(snapshot.brandLabel),
      `목록 slug=${listSlug} 찜 slug=${likedSlug} / 목록 라벨="${snapshot.brandLabel}" 찜="${row.brandText}"`,
    ).toBe(true);
  });

  test("FEATURE_좋아요_060: 상품명이 목록과 일치한다", async () => {
    const likesGoods = new LikesGoodsPage(sharedPage);
    const row = await likesGoods.getLikedRowSnapshot(snapshot.productId);
    const list = snapshot.productName;
    const d = row.titleText;
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
      `목록="${list}" raw="${raw.slice(0, 160)}" 찜="${d}"`,
    ).toBe(true);
  });

  test("FEATURE_좋아요_061: 할인·가격이 목록과 일치한다", async () => {
    const likesGoods = new LikesGoodsPage(sharedPage);
    const row = await likesGoods.getLikedRowSnapshot(snapshot.productId);
    const { ok, listAmounts, detailAmounts } = priceDiscountSetsOverlap(
      snapshot.rawCardText,
      row.raw,
    );
    expect(
      ok,
      `목록 금액 ${listAmounts.join(",")} / 찜 ${detailAmounts.join(",")} — 찜 raw: ${row.raw.slice(0, 400)}`,
    ).toBe(true);
  });
});
