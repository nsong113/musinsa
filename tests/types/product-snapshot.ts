/** 검색 결과 카드에서 수집해 상세와 대조하는 스냅샷 */
export interface ProductListCardSnapshot {
  productId: string;
  brandLabel: string;
  /** 브랜드 샵 URL (표기가 달라도 slug로 일치 검증) */
  brandHref: string;
  productName: string;
  /** 카드 전체 텍스트(가격·할인율 추출용) */
  rawCardText: string;
  imageSrc: string;
  detailPathOrUrl: string;
}
