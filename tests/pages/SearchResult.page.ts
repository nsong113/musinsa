import { Page, Locator, expect } from "@playwright/test";

export class SearchResultPage {
  readonly page: Page;

  readonly relatedKeywords: Locator;
  readonly relatedKeyword: Locator;

  readonly searchTabs: Locator;
  readonly totalProductCount: Locator;
  readonly productList: Locator;
  readonly brandFilter: Locator;
  readonly likeButtons: Locator;

  constructor(page: Page) {
    this.page = page;

    this.relatedKeywords = page.locator('[data-content-name="연관 검색어"]');

    this.relatedKeyword = this.relatedKeywords.locator("button, a[href]");

    this.searchTabs = page.locator('[role="tablist"]').or(page.locator("nav"));

    this.totalProductCount = page
      .getByText(/전체\s*[\d,]+\s*개/)
      .or(page.getByText(/총\s*[\d,]+\s*개/))
      .or(page.getByText(/^[\d,]+\s*개$/))
      .or(page.getByText(/새\s*상품\s*[\d,]+/));

    /** 카드 단위(썸네일·가격·텍스트 동일 영역). 이미지 전용 링크만 있던 a는 제외 */
    this.productList = page
      .locator('[class*="UIItemContainer"]')
      .filter({ has: page.locator('a[href*="/products/"]') });

    this.brandFilter = page
      .getByRole("button", { name: /브랜드/ })
      .or(page.getByText("브랜드", { exact: true }).first());

    this.likeButtons = page.locator(
      '[aria-label*="좋아요"], [data-button-name*="좋아요"], button[class*="like" i]',
    );
  }

  async verifyRelatedKeywords(): Promise<void> {
    const section = this.page.locator('[data-content-name="연관 검색어"]');
    await expect(section).toBeVisible({ timeout: 20000 });
    const chips = section.locator("button, a[href]");
    await expect(chips.first()).toBeVisible();
    const n = await chips.count();
    expect(n).toBeGreaterThan(0);
  }

  /** 풀스크린 Dim(프로모션·바텀시트 등)이 있으면 연관검색어 클릭이 가로막힘 */
  private async dismissPointerBlockingOverlays(): Promise<void> {
    const dim = this.page.locator('[data-mds="Dim"]');
    for (let i = 0; i < 8; i++) {
      const visible = await dim
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) return;
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
  }

  async clickFirstRelatedKeyword(): Promise<void> {
    const section = this.page.locator('[data-content-name="연관 검색어"]');
    await expect(section).toBeVisible({ timeout: 20000 });
    const first = section.locator("button, a[href]").first();
    await expect(first).toBeVisible();
    await this.dismissPointerBlockingOverlays();
    await first.click({ force: true });
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 30000 }).catch(
      () => {},
    );
  }

  async verifySearchTabs(): Promise<void> {
    const required = ["상품", "스냅/코디", "혜택"];
    const optional = ["콘텐츠", "발매"];
    for (const label of required) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tab = this.page
        .getByRole("tab", { name: new RegExp(escaped) })
        .or(this.page.getByRole("link", { name: new RegExp(escaped) }))
        .or(this.page.locator(`button[data-button-name="${label}"]`));
      await expect(tab.first()).toBeVisible({ timeout: 20000 });
    }
    for (const label of optional) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tab = this.page
        .getByRole("tab", { name: new RegExp(escaped) })
        .or(this.page.getByRole("link", { name: new RegExp(escaped) }))
        .or(this.page.locator(`button[data-button-name="${label}"]`));
      await expect.soft(tab.first()).toBeVisible({ timeout: 10000 });
    }
  }

  /** 기본 노출 탭(상품)이 보이고 검색 결과 컨텍스트에 있다 */
  async verifyDefaultProductTab(): Promise<void> {
    const 상품 = this.page
      .getByRole("tab", { name: /^상품$/ })
      .or(this.page.getByRole("link", { name: /^상품$/ }))
      .or(this.page.locator('button[data-button-name="상품"]'))
      .first();
    await expect(상품).toBeVisible({ timeout: 20000 });
    await expect(this.page).toHaveURL(/search|keyword=/);
  }

  async verifyTotalProductCount(): Promise<void> {
    const main = this.page.locator("main").first();
    const countEl = main
      .getByText(/전체\s*[\d,]+\s*개/)
      .or(main.getByText(/총\s*[\d,]+\s*개/))
      .or(main.getByText(/^[\d,]+\s*개$/))
      .or(main.getByText(/새\s*상품\s*[\d,]+/))
      .first();
    await expect(countEl).toBeVisible({ timeout: 20000 });
    const countText = await countEl.textContent();
    const n = parseInt(countText?.replace(/[^\d]/g, "") || "0", 10);
    expect(n).toBeGreaterThan(0);
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

  /** FEATURE_검색_031: 정렬·필터 영역(검색 옵션) 노출 */
  async verifySortOrFilterBar(): Promise<void> {
    await expect(
      this.page
        .locator("main")
        .getByText(/정렬|추천순|인기순|판매순|신상품|낮은가격|필터/)
        .first(),
    ).toBeVisible({ timeout: 20000 });
  }

  /** FEATURE_검색_032: 카테고리·속성 관련 필터 UI */
  async verifyCategoryChips(): Promise<void> {
    await expect(
      this.page
        .locator("main")
        .getByText(/카테고리|의류|상의|하의|아우터|신발|가방|전체/)
        .first(),
    ).toBeVisible({ timeout: 20000 });
  }

  /** FEATURE_검색_033: 검색 결과 리스트 컨테이너 */
  async verifyResultListContainer(): Promise<void> {
    const main = this.page.locator("main").first();
    await expect(main).toBeVisible();
    await expect(this.productList.first()).toBeVisible({ timeout: 25000 });
  }

  /** 가격 필터 소개 등 상단 coachmark 다이얼로그가 브랜드 모달을 가릴 수 있음 */
  private async dismissFilterCoachmarkIfPresent(): Promise<void> {
    const coach = this.page
      .getByRole("dialog")
      .filter({ hasText: /더 똑똑해진|가격 필터 안내|가격 분포/ });
    if (await coach.first().isVisible().catch(() => false)) {
      await coach
        .first()
        .getByRole("button", { name: "닫기" })
        .click({ timeout: 5000 })
        .catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /** 탭의 '브랜드'가 아니라 상세필터 줄의 브랜드 칩 — 탭만 누르면 시트가 안 열림 */
  private brandFilterChip(): Locator {
    const strip = this.page.locator("main div").filter({
      has: this.page.getByRole("button", { name: "상세필터열기" }),
    });
    return strip.getByText("브랜드", { exact: true }).first();
  }

  async clickBrandFilter(): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const chip = this.brandFilterChip();
    if (await chip.isVisible().catch(() => false)) {
      await chip.click();
    } else {
      await this.page.getByRole("button", { name: /브랜드/ }).first().click();
    }
    await this.dismissFilterCoachmarkIfPresent();
  }

  /** 메인 영역에 표시되는 전체 상품 수(n) */
  async getTotalProductCountFromMain(): Promise<number> {
    const main = this.page.locator("main").first();
    const countEl = main
      .getByText(/전체\s*[\d,]+\s*개/)
      .or(main.getByText(/총\s*[\d,]+\s*개/))
      .or(main.getByText(/^[\d,]+\s*개$/))
      .or(main.getByText(/새\s*상품\s*[\d,]+/))
      .first();
    await expect(countEl).toBeVisible({ timeout: 20000 });
    const countText = await countEl.textContent();
    return parseInt(countText?.replace(/[^\d]/g, "") || "0", 10);
  }

  /**
   * [count개의 상품 보기] 또는 정렬 줄의 `3,187개`만 노출되는 경우
   * @param count — 숫자 그대로(74870). UI는 74,870 형태로 표시될 수 있음
   */
  viewProductsButton(count: number): Locator {
    const formatted = count.toLocaleString("ko-KR");
    const esc = formatted.replace(/,/g, "[,]");
    const fullPhrase = new RegExp(`${esc}\\s*개의\\s*상품\\s*보기`);
    const main = this.page.locator("main");
    return this.page
      .locator("button")
      .filter({ hasText: fullPhrase })
      .or(main.getByRole("button", { name: new RegExp(`${esc}`) }))
      .or(main.getByText(new RegExp(`^\\s*${esc}\\s*개\\s*$`)))
      .first();
  }

  /** 모달 시트 또는(검색 PC) 메인 내 인라인 브랜드 칩 영역 */
  private async brandSelectionPanel(): Promise<Locator> {
    const dlg = this.page.locator('[aria-modal="true"], [role="dialog"]').first();
    if (await dlg.isVisible().catch(() => false)) return dlg;
    return this.page.locator("main");
  }

  async selectBrand(brandName: string): Promise<void> {
    await this.dismissFilterCoachmarkIfPresent();
    const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fuzzy = new RegExp(escaped);

    let panel = await this.brandSelectionPanel();
    const brandLine = () => panel.getByText(brandName, { exact: true });

    if ((await brandLine().count()) === 0) {
      await this.brandFilterChip().click({ timeout: 10000 });
      await this.page.waitForTimeout(800);
      await this.dismissFilterCoachmarkIfPresent();
      panel = await this.brandSelectionPanel();
    }

    await expect(brandLine().first()).toBeVisible({ timeout: 25000 });

    const shortQuery = brandName.replace(/\s+/g, "").slice(0, 4);
    const searchInput = panel.locator('input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(shortQuery);
      await this.page.waitForTimeout(600);
      panel = await this.brandSelectionPanel();
    }

    const pageCb = panel.getByRole("checkbox", { name: fuzzy });
    if ((await pageCb.count()) > 0) {
      await pageCb.first().scrollIntoViewIfNeeded();
      await pageCb.first().click();
      return;
    }
    const label = panel.locator("label").filter({ hasText: fuzzy }).first();
    if ((await label.count()) > 0) {
      await label.scrollIntoViewIfNeeded();
      const inp = label.locator('input[type="checkbox"]');
      if ((await inp.count()) > 0) {
        await inp.click();
        return;
      }
      await label.click();
      return;
    }
    const row = panel.getByText(brandName, { exact: true }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.scrollIntoViewIfNeeded();
    const nearCb = row
      .locator("xpath=ancestor-or-self::*[.//input[@type='checkbox']][1]")
      .locator('input[type="checkbox"]')
      .first();
    if ((await nearCb.count()) > 0) {
      await nearCb.click({ force: true });
    } else {
      await row.click({ force: true });
    }
  }

  /** 상단 선택 칩/필터 영역에 브랜드명 노출 */
  async verifyBrandChipVisible(brandName: string): Promise<void> {
    await expect(
      this.page.locator("main").getByText(brandName, { exact: false }).first(),
    ).toBeVisible({ timeout: 15000 });
  }

  /** s: [s개의 상품 보기] 버튼 또는 필터 요약의 `3,187개` 형태 */
  async getBrandFilterSelectionCount(totalN: number): Promise<number> {
    await this.page.waitForTimeout(600);
    /** `44개` 리뷰 등과 구분하려면 반드시 `개의 상품 보기` 문구 포함 */
    const patterns = [
      /([\d,]+)\s*개의\s*상품\s*보기/g,
      /([\d,]+)\s*개\s*의\s*상품\s*보기/g,
    ];
    const nums: number[] = [];
    const extractFrom = (text: string) => {
      for (const p of patterns) {
        p.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = p.exec(text)) !== null) {
          const v = parseInt(m[1].replace(/,/g, ""), 10);
          if (v > 0) nums.push(v);
        }
      }
    };

    const row = this.page
      .locator("button, a, [role='button']")
      .filter({ hasText: /개\s*의\s*상품\s*보기|개의\s*상품\s*보기/ });
    const nRow = await row.count();
    for (let i = 0; i < nRow; i++) {
      const el = row.nth(i);
      const raw =
        (await el.getAttribute("aria-label")) ??
        (await el.innerText()) ??
        "";
      extractFrom(raw);
    }
    if (nums.length === 0) {
      extractFrom(await this.page.locator("main").first().innerText());
    }
    /** PC 검색: `3,187개의 상품 보기` 없이 정렬 줄에 `3,187개`만 있는 경우 */
    if (nums.length === 0) {
      const sortRow = this.page
        .locator("main div")
        .filter({ has: this.page.getByText(/추천순|인기순|판매순|낮은가격|신상품/) })
        .first();
      const barText = await sortRow.innerText().catch(() => "");
      let m: RegExpExecArray | null;
      const re = /([\d,]+)\s*개/g;
      while ((m = re.exec(barText)) !== null) {
        nums.push(parseInt(m[1].replace(/,/g, ""), 10));
      }
    }
    const strictSmaller = nums.filter((x) => x > 0 && x < totalN);
    const s =
      strictSmaller.length > 0
        ? Math.min(...strictSmaller)
        : nums.length > 0
          ? Math.min(...nums)
          : 0;
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(totalN);
    return s;
  }

  async clickViewProductsForCount(count: number): Promise<void> {
    const btn = this.viewProductsButton(count);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    } else {
      const formatted = count.toLocaleString("ko-KR");
      await this.page
        .getByRole("button", { name: new RegExp(`${formatted.replace(/,/g, "[,]")}`) })
        .filter({ hasText: /보기/ })
        .first()
        .click({ timeout: 15000 });
    }
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 30000 }).catch(
      () => {},
    );
    await expect(
      this.page.locator("main").locator('a[href*="/products/"]').first(),
    ).toBeVisible({ timeout: 45000 });
  }

  /**
   * FEATURE_040: 상단에 표시된 건수(s)와 일치하는지(텍스트) + 목록이 로드되는지.
   * s가 크면 무한 스크롤로 DOM 전부를 채우지 않으므로 카드 수는 s 이하·일정 개수 이상만 검증
   *
   * main 영역 고유 상품 ID 수(이미지·제목 링크 중복 제거)
   */
  private async uniqueProductIdCountInMain(): Promise<number> {
    /** 문자열 evaluate는 표현식으로만 평가되어 `() => {}`가 그대로 반환되지 않음 → 항상 함수 참조로 끝나 undefined 직렬화 */
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
   * data-item-brand 또는 카드 텍스트 첫 줄에 브랜드명 포함
   * 좋아요 버튼 기준 카드 루트(레이아웃 클래스가 바뀌어도 동작)
   */
  private productCardFromLikeIndex(index: number): Locator {
    return this.page
      .locator("main")
      .getByRole("button", { name: /좋아요/ })
      .nth(index)
      .locator("xpath=./ancestor::div[5]");
  }

  async verifyAllProductCardsBrandMusinsaStandard(): Promise<void> {
    const likes = this.page.locator("main").getByRole("button", { name: /좋아요/ });
    await expect(likes.first()).toBeVisible({ timeout: 20000 });
    const n = Math.min(await likes.count(), 80);
    expect(n).toBeGreaterThan(0);
    const needles = [/무신사\s*스탠다드/i, /무신사\s*스탠다르/i, /musinsa\s*standard/i];
    for (let i = 0; i < n; i++) {
      const card = this.productCardFromLikeIndex(i);
      const link = card.locator('a[href*="/products/"]').first();
      const brandAttr = await link.getAttribute("data-item-brand");
      const text = ((await card.innerText()) ?? "").slice(0, 200);
      const fromAttr =
        !!brandAttr && /musinsa|standard|스탠다|mss|msstd/i.test(brandAttr);
      const fromText = needles.some((re) => re.test(text));
      if (!fromAttr && !fromText) {
        throw new Error(
          `card ${i}: brandAttr=${brandAttr} text=${text.slice(0, 120)}`,
        );
      }
    }
  }

  /**
   * FEATURE_042: 상품명에 검색 키워드 포함 비율 ≥ 80%
   * 상품명은 제목 링크(텍스트 있는 /products/ 링크) 기준
   */
  async verifyProductNamesContainKeywordAtLeast(
    keyword: string,
    ratio: number,
  ): Promise<void> {
    const likes = this.page.locator("main").getByRole("button", { name: /좋아요/ });
    const n = Math.min(await likes.count(), 80);
    expect(n).toBeGreaterThan(0);
    let hit = 0;
    const kw = keyword.toLowerCase();
    for (let i = 0; i < n; i++) {
      const card = this.productCardFromLikeIndex(i);
      const title = card
        .locator('a[href*="/products/"]')
        .filter({ hasText: /\S/ })
        .first();
      const t = ((await title.innerText()) ?? "").toLowerCase();
      if (t.includes(kw)) hit++;
    }
    expect(hit / n).toBeGreaterThanOrEqual(ratio);
  }

  async closeBrandFilterDialogIfOpen(): Promise<void> {
    const dialog = this.page.locator('[aria-modal="true"]').first();
    if (await dialog.isVisible().catch(() => false)) {
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
  }

  async clickLikeButton(productIndex: number = 0): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible();
    await likeButton.click({ force: true });
  }

  async verifyLikeButtonActive(productIndex: number = 0): Promise<void> {
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toHaveClass(/active|liked|selected|on/i);
  }

  /** 활성화된 좋아요만 한 번 더 눌러 취소(계정·다음 테스트 오염 방지) */
  async deactivateLikeAt(productIndex: number = 0): Promise<void> {
    await this.dismissPointerBlockingOverlays();
    const likeButton = this.likeButtons.nth(productIndex);
    await expect(likeButton).toBeVisible({ timeout: 15000 });
    const cls = (await likeButton.getAttribute("class")) ?? "";
    if (!/active|liked|selected|on/i.test(cls)) return;
    await likeButton.click({ force: true });
    await this.page.waitForTimeout(400);
  }
}
