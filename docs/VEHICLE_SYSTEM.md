# 차량 시스템 (Vehicle)

## 엔티티: `Vehicle`

| 필드 | 설명 |
|------|------|
| `name` | 고객 노출 차량명 |
| `brand` / `model` | 필터·관리용 |
| `priceWon` | 차량 가격 (원, 정수) |
| `depositPercent` | 보증금 비율 0–100 (정수 %) |
| `monthlyPaymentWon` | 월 납입 예상 (원) |
| `contractMonths` | 계약 기간(개월) |
| `imageUrl` | 이미지 URL (데모: Unsplash 등) |
| `modelYear?` | 연식 (카탈로그 자동완성·가격 조정에 사용) |
| `branchId` | 소속 지점 (`docs/BRANCH_SYSTEM.md`) |
| `status` | 아래 상태 머신 |

## 차량 등록 UX · mock 카탈로그 (3차)

- 관리자 **`/admin/vehicles/new`**: 차량명·브랜드·연식 중심 입력, **이미지 URL** 필드.
- **`src/lib/mock-vehicle-catalog.ts`** — `mockVehicleCatalog` 배열, `findCatalogMatch` / `buildVehicleDraftFromCatalog` 로 이름·연식 기준 **가격·기본 정보 자동 매칭** (외부 API 없음).
- 카탈로그에 없으면 수동으로 가격·보증금 비율·월납 등을 그대로 편집 가능.
- **`src/lib/vehicle-pricing.ts`** — 차량가·보증금·월 납입 **추정/재계산** 헬퍼 (데모용 휴리스틱).

## 차량 상태

| 값 | 의미 |
|----|------|
| `available` | 렌트 가능 |
| `reserved` | 예약/검토 중 |
| `contracted` | 계약 연결됨 |
| `maintenance` | 점검/정비 |
| `hidden` | 고객 목록 비노출 (관리자만) |

## 고객 목록 규칙

- `/vehicles` 에서는 `hidden` 차량을 제외합니다.

## 차량 ↔ 계약 (자동 동기화)

- 계약 레코드의 `vehicleId`로 연결.
- **재고 상태는 UI에서 직접 숫자 조작하지 않고**, `src/lib/vehicle-contract-sync.ts` 의 규칙으로 **계약 목록 기준 재계산(reconcile)** 됩니다.
  - 계약 `active` / `overdue` → 차량 `contracted`
  - 계약 `pending` / `reviewing` / `approved` → 차량 `reserved`
  - 해당 차량의 살아있는 파이프라인 계약이 없고 종료만 남은 경우 → `available`
- 차량이 `hidden` 또는 `maintenance` 인 경우 **자동 동기화 제외** (수동 정책 유지).

## 이미지

- Next `Image` + `next.config.ts`의 `remotePatterns`로 외부 호스트 허용
- 프로덕션에서는 CDN/S3 및 업로드 파이프라인 권장
