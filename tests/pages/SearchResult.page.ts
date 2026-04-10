import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "@/pages/Base.page";

export class SearchResultPage extends BasePage {
  readonly relatedKeywords: Locator;
  readonly relatedKeyword: Locator;

  readonly searchTabs: Locator;
  readonly brandFilter: Locator;

  constructor(page: Page) {
    super(page);

    this.relatedKeywords = page.locator('[data-content-name="연관 검색어"]');

    this.relatedKeyword = this.relatedKeywords.locator("button, a[href]");

    this.searchTabs = page.locator('[role="tablist"]').or(page.locator("nav"));

    this.brandFilter = page
      .getByRole("button", { name: /브랜드/ })
      .or(page.getByText("브랜드", { exact: true }).first());
  }

  async verifyRelatedKeywords(): Promise<void> {
    const section = this.page.locator('[data-content-name="연관 검색어"]');
    await expect(section).toBeVisible({ timeout: 20000 });
    const chips = section.locator("button, a[href]");
    await expect(chips.first()).toBeVisible();
    const n = await chips.count();
    expect(n).toBeGreaterThan(0);
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

  async closeBrandFilterDialogIfOpen(): Promise<void> {
    const dialog = this.page.locator('[aria-modal="true"]').first();
    if (await dialog.isVisible().catch(() => false)) {
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
  }
}
