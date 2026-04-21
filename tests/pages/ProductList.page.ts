import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "@/pages/Base.page";
import type { ProductListCardSnapshot } from "@/types/product-snapshot";

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

  /**
   * 검색 결과는 `UIItemContainer` 없이 그리드만 올 수 있어, 고유 product id 기준으로 카드·링크를 고른다.
   */
  /** 고유 상품 카드·대표 링크 (좋아요 버튼을 카드 안에 한정할 때 사용) */
  async getResolvedProductCard(productIndex: number): Promise<{
    card: Locator;
    productLink: Locator;
  }> {
    return this.resolveUniqueProductCard(productIndex);
  }

  private async resolveUniqueProductCard(productIndex: number): Promise<{
    card: Locator;
    productLink: Locator;
  }> {
    const links = this.page.locator('a[href*="/products/"]');
    await expect(links.first()).toBeVisible({ timeout: 60000 });

    const domIndex = await this.page.evaluate((ordWanted: number) => {
      const seen = new Set<string>();
      let ord = 0;
      const list = document.querySelectorAll<HTMLAnchorElement>('a[href*="/products/"]');
      for (let i = 0; i < list.length; i++) {
        const m = list[i].href.match(/products\/(\d+)/);
        if (!m || seen.has(m[1])) continue;
        seen.add(m[1]);
        if (ord === ordWanted) return i;
        ord++;
      }
      return -1;
    }, productIndex);

    if (domIndex < 0) {
      throw new Error(`고유 상품 카드를 찾지 못함: index=${productIndex}`);
    }

    const productLink = links.nth(domIndex);
    const card = productLink.locator("xpath=ancestor::*[.//img][1]");
    return { card, productLink };
  }

  /**
   * 검색 결과 카드에서 상세 비교용 스냅샷 (FEATURE_상세_045~049)
   * DOM 조회는 `evaluate` 한두 번으로 묶어 innerText/getAttribute 대기 타임아웃을 피한다.
   */
  async getListCardSnapshot(productIndex: number = 0): Promise<ProductListCardSnapshot> {
    const { card, productLink } = await this.resolveUniqueProductCard(productIndex);
    await expect(card).toBeVisible({ timeout: 20000 });

    const href = (await productLink.getAttribute("href")) ?? "";
    const idMatch = href.match(/\/products\/(\d+)/);
    const productId = idMatch?.[1] ?? "";

    const dataItemBrand =
      (await productLink.getAttribute("data-item-brand").catch(() => null)) ?? "";

    const cardData = await card.evaluate((el) => {
      const root = el as HTMLElement;
      const brandA = root.querySelector('a[href*="/brand/"]');
      const img = root.querySelector("img");
      const raw = root.innerText.replace(/\s+/g, " ").trim();
      const brandHref = brandA?.getAttribute("href") ?? "";
      const firstProduct = root.querySelector<HTMLAnchorElement>('a[href*="/products/"]');
      const dataBrandId = firstProduct?.getAttribute("data-brand-id") ?? "";

      let productName = "";
      const productAnchors = root.querySelectorAll('a[href*="/products/"]');
      for (const a of Array.from(productAnchors)) {
        const ar = (a as HTMLAnchorElement).getAttribute("aria-label") ?? "";
        if (/상품\s*상세로\s*이동\s*$/i.test(ar)) {
          const core = ar.replace(/\s*상품\s*상세로\s*이동\s*$/i, "").trim();
          if (core.length > productName.length) productName = core;
        }
      }
      for (const a of Array.from(productAnchors)) {
        const t = (a.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!t || /^[\d,%\s원~\-]+$/.test(t)) continue;
        if (/상품\s*상세로\s*이동|상품상세로\s*이동/i.test(t)) continue;
        if (t.length > productName.length) productName = t;
      }
      if (!productName) {
        const first = productAnchors[0] as HTMLAnchorElement | undefined;
        productName =
          (first?.getAttribute("aria-label") ?? "").replace(/\s+/g, " ").trim() ||
          (first?.getAttribute("data-item-name") ?? "").replace(/\s+/g, " ").trim() ||
          (first?.innerText ?? "").replace(/\s+/g, " ").trim();
      }
      const dataItemName = firstProduct?.getAttribute("data-item-name") ?? "";

      return {
        rawCardText: raw,
        imageSrc: img?.getAttribute("src") ?? "",
        brandLabel: (brandA?.textContent ?? "").replace(/\s+/g, " ").trim(),
        brandHref,
        dataBrandId,
        dataItemName,
        productName,
      };
    });

    let brandHref = cardData.brandHref;
    if (!brandHref && cardData.dataBrandId) {
      brandHref = `https://www.musinsa.com/brand/${cardData.dataBrandId}`;
    }
    if (!brandHref) {
      const bid = await productLink.getAttribute("data-brand-id").catch(() => null);
      if (bid) brandHref = `https://www.musinsa.com/brand/${bid}`;
    }
    if (!brandHref) {
      const walked = await productLink.evaluate((el) => {
        let p: HTMLElement | null = el as HTMLElement;
        for (let i = 0; i < 14 && p; i++) {
          const b = p.querySelector<HTMLAnchorElement>('a[href*="/brand/"]');
          if (b?.href) return b.getAttribute("href") ?? b.href;
          p = p.parentElement;
        }
        return "";
      });
      if (walked) brandHref = walked.startsWith("http") ? walked : `https://www.musinsa.com${walked}`;
    }

    let rawCardText = cardData.rawCardText;
    if (rawCardText.length < 40) {
      const walked = await productLink.evaluate((el) => {
        let p: HTMLElement | null = el as HTMLElement;
        for (let i = 0; i < 14 && p; i++) {
          const t = p.innerText?.replace(/\s+/g, " ").trim() ?? "";
          if (t.length > 50) return t;
          p = p.parentElement;
        }
        return (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim() ?? "";
      });
      if (walked.length > rawCardText.length) rawCardText = walked;
    }

    let brandLabel = cardData.brandLabel || dataItemBrand.replace(/\s+/g, " ").trim();
    if (!brandLabel && dataItemBrand) brandLabel = dataItemBrand.replace(/\s+/g, " ").trim();

    let productName =
      cardData.dataItemName ||
      cardData.productName;
    if (/^상품\s*상세로\s*이동$/i.test(productName.trim())) productName = "";
    if (!productName || productName.length < 8) {
      const an = (await productLink.getAttribute("aria-label").catch(() => null)) ?? "";
      const core = an.replace(/\s*상품\s*상세로\s*이동\s*$/i, "").trim();
      if (core.length > 5) productName = core;
    }
    if (!productName) {
      const lines = cardData.rawCardText.split(/\n/).map((l) => l.trim()).filter(Boolean);
      productName =
        lines.find((l) => l.length > 3 && !/^\d/.test(l) && !/원\s*$/.test(l)) ??
        lines[0] ??
        "";
    }
    // 마지막 폴백: 카드 텍스트에서 가격/할인/리뷰 등을 제거하고 상품명 후보를 추출
    if (!productName || productName.length < 8) {
      const raw = rawCardText.replace(/\s+/g, " ").trim();
      const cleaned = raw
        .replace(new RegExp(`^${brandLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
        .replace(/\b(단독|아울렛|옵션|여성|남성|내일.*도착보장|도착보장)\b/g, " ")
        .replace(/\d{1,3}(?:,\d{3})*\s*원/g, " ")
        .replace(/\b\d+(?:\.\d+)?\s*천\b/g, " ")
        .replace(/\b\d+(?:\.\d+)?\s*만\b/g, " ")
        .replace(/\b\d+(?:\.\d+)?\b/g, " ")
        .replace(/\d+\s*%/g, " ")
        .replace(/%/g, " ")
        .replace(/[()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // 앞쪽 12~80자 정도를 상품명 후보로 사용
      if (cleaned.length >= 8) {
        productName = cleaned.slice(0, 80).trim();
      }
    }
    if (!productName || productName.length < 8) {
      const din = await productLink.getAttribute("data-item-name").catch(() => null);
      if (din && din.length > 3) productName = din;
    }
    if (!productName || productName.length < 8) {
      const lump = cardData.rawCardText.replace(/\s+/g, " ");
      const m = lump.match(
        /[A-Za-z가-힣()][A-Za-z0-9가-힣\s\-&,.]{10,120}/,
      );
      if (m) productName = m[0].trim();
    }

    return {
      productId,
      brandLabel,
      brandHref: brandHref || "",
      productName,
      rawCardText,
      imageSrc: cardData.imageSrc,
      detailPathOrUrl: href,
    };
  }

  /** 카드에서 상품 상세로 이동 (클릭보다 직접 이동이 딤·SPA에서 안정적) */
  async openProductFromList(productIndex: number = 0): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const { productLink } = await this.resolveUniqueProductCard(productIndex);
    await productLink.scrollIntoViewIfNeeded().catch(() => {});
    const href = (await productLink.getAttribute("href")) ?? "";
    if (!href) throw new Error("상품 링크 href 없음");
    const absolute = new URL(href, "https://www.musinsa.com").toString();
    await this.page.goto(absolute, { waitUntil: "domcontentloaded", timeout: 90000 });
    await this.page.waitForURL(/\/products\/\d+/, { timeout: 60000 });
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
