/**
 * 목록은 말줄임·줄바꿈으로 상세와 문자열이 100% 동일하지 않을 수 있어 완화 비교
 */
export function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function productNamesConsistent(listName: string, detailName: string): boolean {
  const a = normalizeWs(listName);
  const b = normalizeWs(detailName);
  if (!a || !b) return false;
  if (a === b) return true;

  const stripTrail = (s: string) =>
    s.replace(/…+$/u, "").replace(/\.\.\.$/, "").trim();

  const aa = stripTrail(a);
  const bb = stripTrail(b);
  if (bb.startsWith(aa) || aa.startsWith(bb)) return true;
  if (b.includes(aa.slice(0, Math.min(24, aa.length))) && aa.length >= 8) return true;
  if (a.includes(bb.slice(0, Math.min(24, bb.length))) && bb.length >= 8) return true;
  const alnum = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  const A = alnum(aa);
  const B = alnum(bb);
  if (A.length >= 10 && B.length >= 10 && (B.includes(A.slice(0, 12)) || A.includes(B.slice(0, 12)))) {
    return true;
  }
  return false;
}

/** '12,000원' / '12000원' 등 원 단위 금액 숫자부 */
export function extractWonAmounts(text: string): string[] {
  const out: string[] = [];
  const re = /[\d,]+(?=\s*원)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[0].replace(/,/g, ""));
  }
  return [...new Set(out)];
}

/** 할인율 숫자 % */
export function extractPercentages(text: string): string[] {
  const out: string[] = [];
  const re = /(\d+)\s*%/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1]);
  }
  return [...new Set(out)].sort();
}

/**
 * 목록·상세에서 추출한 원화 금액이 겹치고, 목록에 %가 있으면 상세에도 동일 비율이 있는지 확인
 */
export function priceDiscountSetsOverlap(
  listText: string,
  detailText: string,
): { ok: boolean; listAmounts: string[]; detailAmounts: string[] } {
  const la = extractWonAmounts(listText);
  const da = extractWonAmounts(detailText);
  const lp = extractPercentages(listText);
  const dp = extractPercentages(detailText);

  const amountOverlap = la.some((x) => da.includes(x));
  const percentOk =
    lp.length === 0 || lp.some((p) => dp.includes(p));

  const ok = amountOverlap && percentOk && la.length > 0 && da.length > 0;

  return { ok, listAmounts: la, detailAmounts: da };
}

/** `/brand/avan` → `avan` */
export function brandSlugFromHref(href: string): string {
  const m = href.match(/\/brand\/([^/?#]+)/i);
  return (m?.[1] ?? "").toLowerCase();
}

