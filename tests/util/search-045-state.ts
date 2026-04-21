import { expect, type Page } from "@playwright/test";
import type { ProductListCardSnapshot } from "@/types/product-snapshot";

/**
 * 검색_045: 메인 → 검색 → 목록 첫 카드 스냅샷 → 해당 상품 상세 진입 후
 * URL이 동일 product id이고, 목록에서 읽은 브랜드 라벨이 존재한다.
 * 좋아요(056~) 등 “검색_045까지 완료”가 전제인 케이스에서 상세 진입 직후 호출한다.
 */
export async function assertSearch045Completed(
  page: Page,
  snapshot: ProductListCardSnapshot,
): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/products/${snapshot.productId}(?:\\?|$)`));
  expect(snapshot.brandLabel.length).toBeGreaterThan(0);
}
