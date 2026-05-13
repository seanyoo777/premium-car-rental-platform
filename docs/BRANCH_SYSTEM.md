# 지점 시스템 (Branch)

## 현재 구현 (데모)

- 타입: `Branch` (`src/lib/types.ts`)
- 저장 위치: `CompanyProfile.branches[]` (가람렌트카 / 올인카와 함께 `localStorage`에 영속)
- 시드: `DEFAULT_BRANCHES` — **본사(HQ)** + **김해 지점**
- 기본 비즈니스 지점 ID: **`br-gimhae`** (`DEFAULT_DEMO_BRANCH_ID` in `src/lib/constants.ts`)
- 관리 UI: `/admin/company` — 지점 추가·삭제(본사 제외)·지역 태그·특별 혜택 문구 편집 (**`hq_admin`만** 수정 가능, mock RBAC)

| 필드 | 설명 |
|------|------|
| `id` | 고유 ID |
| `name` | 지점명 |
| `code` | 내부 코드 |
| `isHeadquarters` | 본사 여부 (삭제 불가) |
| `regionTag` | 지역 태그 (예: 김해) |
| `specialBenefitsNote` | 지점별 프로모/혜택 문구 |

## 4차: 엔티티 `branchId`

다음 엔티티에 **`branchId: string`** 이 붙으며, 구버전 저장 데이터는 `normalizeLegacyDemoState` (`src/lib/demo-state-normalize.ts`)로 **`br-gimhae` 기본값**이 채워집니다.

- `Vehicle`, `Customer`, `Application`, `Contract`, `PaymentRecord`

계약·납부의 `branchId`는 생성 시 고객/차량/신청과 정합되도록 설정됩니다. 납부 스케줄 생성 시 계약의 `branchId`를 복사합니다.

## 관리자 스코프

- **`scopeAdminLists`**: 현재 `AdminAccessState`에 따라 목록을 필터링합니다 (`src/lib/admin-scope.ts`).
- **지점 관리자·영업**: `assignedBranchId`(기본 김해)로 고정 필터.
- **본사·재무·읽기 전용**: `filterBranchId` (null = 전체)로 UI 필터.

## 고객 화면과의 관계

- 랜딩의 지역 메시지는 `regionNote` 등 카피 필드 사용.
- 고객 신청 시 `preferredVehicleId`가 있으면 해당 차량의 `branchId`를 신청에 복사합니다.

## 권장 확장 (실서비스)

- 지점 관리자 계정에 `branchId` 부여, 서버에서 **쿼리 스코프 강제**
- 본사: 전 지점 집계 대시보드, 정책 마스터

## 마이그레이션 순서

1. `Branch` 테이블 + 관리자 `branchId`
2. 차량·계약·납부에 FK 추가 (현재 데모는 단일 `branchId` 문자열)
3. 고객 신청에 희망 지점 선택 (옵션)
