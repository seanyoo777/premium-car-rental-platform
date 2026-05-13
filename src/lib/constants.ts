import type { Branch, CompanyProfile } from "./types";

export const STORAGE_KEY = "premium-car-rental-demo-v1";

/** 데모 기본 지점 (김해) — 엔티티 branchId 기본값 */
export const DEFAULT_DEMO_BRANCH_ID = "br-gimhae";

export const ADMIN_ACCESS_STORAGE_KEY = "premium-car-rental-admin-access-v1";

export const BENEFIT_PACKAGES = [
  { id: "glass", title: "유리막 코팅", description: "시인성·발수를 동시에 챙기는 유리 보호" },
  { id: "hydro", title: "유리 발수 코팅", description: "우천 시 시야 안정에 도움" },
  { id: "leather", title: "가죽 코팅", description: "내장 마모·오염에 대한 보호" },
  { id: "ppf", title: "생활 PPF", description: "스톤칩·스크래치 완충에 유리한 필름" },
  { id: "mat", title: "트랩매트", description: "실내 청결 유지용 매트" },
] as const;

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "br-hq",
    name: "가람렌트카 본사",
    code: "HQ",
    isHeadquarters: true,
    regionTag: "전국",
    specialBenefitsNote: "본사 정책·가격 기준(데모)",
  },
  {
    id: "br-gimhae",
    name: "김해 지점",
    code: "GH",
    isHeadquarters: false,
    regionTag: "김해",
    specialBenefitsNote: "김해 고객 특별 혜택(데모 기본 지점)",
  },
];

export const DEFAULT_COMPANY: CompanyProfile = {
  vendorName: "가람렌트카",
  agencyName: "올인카",
  vendorPhone: "0000-0000",
  regionNote: "김해 고객 특별 혜택(데모)",
  transparencyNote: "숨겨진 금액 없음 · 3년 보증(사업 안내 기준, 데모)",
  branches: DEFAULT_BRANCHES,
};
