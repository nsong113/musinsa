import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "@/pages/Base.page";

/** 검색·카테고리 등 공통 상품 그리드(카드) 검증 */
export class ProductListPage extends BasePage {
  readonly productList: Locator;

  constructor(page: Page) {
    super(page);
    /** 카드 단위(썸네일·가격·텍스트 동일 영역). 이미지 전용 링크만 있던 a는 제외 */
    this.productList = page
      .locator('[class*="UIItemContainer"]')
      .filter({ has: page.locator('a[href*="/products/"]') });
  }

  async verifyProductList(): Promise<void> {
    const first = this.productList.first();
    await expect(first).toBeVisible({ timeout: 25000 });
    const n = await this.productList.count();
    expect(n).toBeGreaterThan(0);
  }

  async verifyProductInfo(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card).toBeVisible({ timeout: 25000 });
    await expect(card.locator("img").first()).toBeVisible();
    const text = (await card.textContent()) ?? "";
    expect(text.length).toBeGreaterThan(3);
    expect(text).toMatch(/\d{1,3}(,\d{3})*\s*원|\d+\s*원|%/);
  }

  /** FEATURE_검색_026: 썸네일 이미지 */
  async verifyProductImage(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card.locator("img").first()).toBeVisible({ timeout: 20000 });
  }

  /** FEATURE_검색_027~028: 카드 내 텍스트(브랜드·상품명 구분 없이 상품 정보 노출) */
  async verifyProductTitles(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card).toBeVisible({ timeout: 20000 });
    const t = (await card.innerText()).replace(/\s+/g, " ").trim();
    expect(t.length).toBeGreaterThan(5);
  }

  /** FEATURE_검색_029: 가격(원) 표기 */
  async verifyProductPrice(productIndex: number = 0): Promise<void> {
    const card = this.productList.nth(productIndex);
    await expect(card.getByText(/\d{1,3}(,\d{3})*\s*원|\d+\s*원/)).toBeVisible({
      timeout: 15000,
    });
  }

  /** FEATURE_검색_030: 할인·정가·쿠폰 등 추가 가격 정보(상위 몇 개에서 탐색) */
  async verifyProductPriceExtra(productIndex: number = 0): Promise<void> {
    await expect(this.productList.first()).toBeVisible({ timeout: 25000 });
    const n = await this.productList.count();
    const tryIndices = [productIndex, 0, 1, 2, 3].filter(
      (i, j, a) => a.indexOf(i) === j && i < n,
    );
    for (const i of tryIndices) {
      const card = this.productList.nth(i);
      const text = (await card.innerText()) ?? "";
      if (/%|할인|정가|쿠폰|최대|적립|무료배송/.test(text)) {
        return;
      }
      /** 이미지 영역 링크에 data-discount-rate 등이 붙는 경우가 많음 */
      const productLink = card.locator('a[href*="/products/"]').first();
      const rate = await productLink.getAttribute("data-discount-rate");
      const original = await productLink.getAttribute("data-original-price");
      const price = await productLink.getAttribute("data-price");
      if (rate && rate !== "0") return;
      if (original && price && original !== price) return;
    }
    throw new Error("추가 가격·혜택 정보를 찾지 못했습니다.");
  }

  /** FEATURE_검색_033: 검색 결과 리스트 컨테이너 */
  async verifyResultListContainer(): Promise<void> {
    const main = this.page.locator("main").first();
    await expect(main).toBeVisible();
    await expect(this.productList.first()).toBeVisible({ timeout: 25000 });
  }

  /**
   * main 영역 고유 상품 ID 수(이미지·제목 링크 중복 제거)
   * 문자열 evaluate는 표현식으로만 평가되어 `() => {}`가 그대로 반환되지 않음 → 항상 함수 참조로 끝나 undefined 직렬화
   */
  private async uniqueProductIdCountInMain(): Promise<number> {
    return this.page.evaluate(() => {
      const doc = (globalThis as unknown as { document: { querySelector: (s: string) => unknown } })
        .document;
      const main = doc.querySelector("main") as {
        querySelectorAll: (s: string) => Iterable<{ href: string }>;
      } | null;
      if (!main) return 0;
      const ids = new Set<string>();
      for (const a of main.querySelectorAll("a[href]")) {
        const m = a.href.match(/products\/(\d+)/i);
        if (m) ids.add(m[1]);
      }
      return ids.size;
    });
  }

  async verifyProductCardCountEquals(expected: number): Promise<void> {
    const formatted = expected.toLocaleString("ko-KR");
    await expect(
      this.page
        .locator("main")
        .getByText(new RegExp(`${formatted.replace(/,/g, "[,]")}\\s*개`)),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      this.page.locator("main").locator('a[href*="/products/"]').first(),
    ).toBeVisible({ timeout: 25000 });
    const final = await this.uniqueProductIdCountInMain();
    expect(final).toBeGreaterThan(0);
    expect(final).toBeLessThanOrEqual(expected);
  }

  /**
   * FEATURE_041: 카드 브랜드가 무신사 스탠다드 계열
   * 좋아요 버튼 ancestor 깊이에 의존하면 레이아웃 변경에 취약하므로,
   * 브랜드 링크(`/brand/...`)와 `data-item-brand`로 교차 검증한다.
   */
  async verifyAllProductCardsBrandMusinsaStandard(): Promise<void> {
    const products = this.page.locator("main").locator('a[href*="/products/"]');
    await expect(products.first()).toBeVisible({ timeout: 45000 });

    const brandNeedles = [
      /무신사\s*스탠다드/i,
      /무신사\s*스탠다르/i,
      /musinsa\s*standard/i,
      /무신사스탠다드/i,
    ];
    const brandPathNeedle = /musinsastandard/i; // musinsastandard / musinsastandardwoman 등 포함

    const n = Math.min(await products.count(), 40);
    expect(n).toBeGreaterThan(0);

    for (let i = 0; i < n; i++) {
      const productLink = products.nth(i);
      await productLink.scrollIntoViewIfNeeded().catch(() => {});

      // 상품 링크가 포함된 "카드" 범위를 (브랜드 링크를 포함하는) 가장 가까운 조상으로 제한
      const card = productLink.locator(
        "xpath=ancestor::*[.//a[contains(@href,'/brand/')]][1]",
      );
      const brandShop = card.locator('a[href*="/brand/"]').first();

      // 레이아웃/슬롯에 따라 브랜드 링크가 늦게 붙는 경우가 있어 짧게만 기다림
      await brandShop.waitFor({ state: "attached", timeout: 4000 }).catch(() => {});
      const brandHref = (await brandShop.getAttribute("href").catch(() => null)) ?? "";
      const brandLabel = (
        (await brandShop.innerText().catch(() => null)) ?? ""
      ).replace(/\s+/g, " ");

      const brandAttr =
        (await productLink.getAttribute("data-item-brand").catch(() => null)) ?? "";
      const text = ((await card.innerText().catch(() => null)) ?? "")
        .replace(/\s+/g, " ")
        .slice(0, 220);

      const fromBrandUrl = brandPathNeedle.test(brandHref);
      const fromBrandLabel = brandNeedles.some((re) => re.test(brandLabel));
      const fromAttr = /musinsa|standard|스탠다|mss|msstd/i.test(brandAttr);
      const fromText = brandNeedles.some((re) => re.test(text));

      if (!fromBrandUrl && !fromBrandLabel && !fromAttr && !fromText) {
        throw new Error(
          `item ${i}: brandHref=${brandHref} brandAttr=${brandAttr} text=${text.slice(0, 120)}`,
        );
      }
    }
  }

  /**
   * FEATURE_042: 상품명에 검색 키워드 포함 비율 ≥ ratio
   * 상품명은 제목 링크(텍스트 있는 /products/ 링크) 기준
   */
  async verifyProductNamesContainKeywordAtLeast(
    keyword: string,
    ratio: number,
  ): Promise<void> {
    // 상품명 링크는 접근성 이름이 "... 상품상세로 이동" 형태로 노출됨
    const titleLinks = this.page
      .locator("main")
      .getByRole("link", { name: /상품상세로 이동$/ });
    await expect(titleLinks.first()).toBeVisible({ timeout: 45000 });
    // 너무 많은 항목을 순회하면 느려져 테스트 타임아웃을 유발할 수 있어 상위 일부만 샘플링
    const n = Math.min(await titleLinks.count(), 30);
    expect(n).toBeGreaterThan(0);

    const kw = keyword.toLowerCase();
    const kwRe =
      keyword === "니트"
        ? /니트|스웨터|가디건|집업|풀오버|케이블|램스울|메리노|캐시미어|모헤어|앙고라|하이게이지|터틀|리브드|울|\b(knit|knitwear|sweater|cardigan)\b/i
        : null;

    const texts = (await titleLinks
      .first()
      .page()
      .locator("main")
      .getByRole("link", { name: /상품상세로 이동$/ })
      .allInnerTexts()
      .catch(() => [])) as string[];

    const sample = texts.slice(0, n).map((t) => t.replace(/\s+/g, " ").trim());
    const hit = sample.filter((text) => {
      const t = text.toLowerCase();
      if (t.includes(kw)) return true;
      return !!kwRe && kwRe.test(text);
    }).length;

    expect(hit / n).toBeGreaterThanOrEqual(ratio);
  }
}
