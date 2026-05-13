import { computeDepositWon } from "./format";

/** 내부 mock 카탈로그 (외부 API 없음) */
export interface MockCatalogEntry {
  id: string;
  brandKo: string;
  modelKo: string;
  /** 차량명/검색용 키워드 */
  keywords: string[];
  yearFrom: number;
  yearTo: number;
  basePriceWon: number;
  depositPercent: number;
  /** 36개월 기준 제안 월납 */
  monthlyWon36: number;
  imageUrl: string;
}

export const mockVehicleCatalog: MockCatalogEntry[] = [
  {
    id: "cat-gv80",
    brandKo: "제네시스",
    modelKo: "GV80",
    keywords: ["gv80", "제네시스 gv80", "gv 80"],
    yearFrom: 2021,
    yearTo: 2026,
    basePriceWon: 85_000_000,
    depositPercent: 20,
    monthlyWon36: 1_250_000,
    imageUrl:
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cat-bmw5",
    brandKo: "BMW",
    modelKo: "5시리즈",
    keywords: ["520i", "5시리즈", "bmw 5", "5 series"],
    yearFrom: 2019,
    yearTo: 2026,
    basePriceWon: 62_000_000,
    depositPercent: 18,
    monthlyWon36: 980_000,
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cat-ev6",
    brandKo: "기아",
    modelKo: "EV6",
    keywords: ["ev6", "기아 ev6"],
    yearFrom: 2021,
    yearTo: 2026,
    basePriceWon: 55_000_000,
    depositPercent: 15,
    monthlyWon36: 890_000,
    imageUrl:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=80",
  },
];

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * 차량명·브랜드·모델·연식으로 카탈로그 매칭 (가장 먼저 일치하는 항목).
 */
export function findCatalogMatch(input: {
  name: string;
  brand: string;
  model: string;
  year: number;
}): MockCatalogEntry | null {
  const blob = norm(`${input.brand} ${input.model} ${input.name}`);
  const y = Number.isFinite(input.year) ? Math.round(input.year) : 2026;
  for (const e of mockVehicleCatalog) {
    if (y < e.yearFrom || y > e.yearTo) continue;
    const brandOk =
      norm(input.brand).includes(norm(e.brandKo)) ||
      norm(e.brandKo).includes(norm(input.brand));
    const modelOk =
      norm(input.model).includes(norm(e.modelKo)) ||
      norm(e.modelKo).includes(norm(input.model));
    const keyHit = e.keywords.some((k) => blob.includes(norm(k)));
    if ((brandOk && modelOk) || keyHit) return e;
  }
  return null;
}

/** 연식에 따른 가격·월납 조정 (mock, 연 1.5% 감가 상한 12%) */
export function priceAdjustedForYear(entry: MockCatalogEntry, year: number): number {
  const ref = Math.min(entry.yearTo, Math.max(entry.yearFrom, year));
  const yearsDown = entry.yearTo - ref;
  const factor = Math.max(0.88, 1 - yearsDown * 0.015);
  return Math.round(entry.basePriceWon * factor);
}

export function buildVehicleDraftFromCatalog(
  entry: MockCatalogEntry,
  input: { name: string; brand: string; model: string; year: number },
) {
  const y = Number.isFinite(input.year) ? Math.round(input.year) : entry.yearTo;
  const priceWon = priceAdjustedForYear(entry, y);
  const depositPercent = entry.depositPercent;
  const monthlyBase = Math.round(
    (entry.monthlyWon36 * priceWon) / entry.basePriceWon,
  );
  const displayName =
    input.name.trim() || `${entry.brandKo} ${entry.modelKo} ${y} (카탈로그)`;
  return {
    name: displayName,
    brand: input.brand.trim() || entry.brandKo,
    model: input.model.trim() || entry.modelKo,
    modelYear: y,
    priceWon,
    depositPercent,
    monthlyPaymentWon: Math.max(300_000, monthlyBase),
    contractMonths: 36,
    imageUrl: entry.imageUrl,
    depositWon: computeDepositWon(priceWon, depositPercent),
  };
}
