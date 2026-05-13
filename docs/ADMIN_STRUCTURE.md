# 관리자 구조 (Admin)

## 역할 계층 (기획)

| 역할 | 책임 | 비고 |
|------|------|------|
| 본사 관리자 | 전 지점 정책, 차량 마스터, 계약 승인, 가격 정책 | mock: `hq_admin` |
| 지점 관리자 | 현장·상담·고객, 소속 지점 데이터 | mock: `branch_admin` |
| 영업 매니저 | 신청·상담 중심 | mock: `sales_manager` |
| 재무 매니저 | 납부·입금확인 중심 | mock: `finance_manager` |
| 읽기 전용 | 조회만 | mock: `readonly` |

## 4차: mock RBAC + 지점 스코프

- **상태 저장**: `sessionStorage` 키 `premium-car-rental-admin-access-v1` (`ADMIN_ACCESS_STORAGE_KEY`). 비즈니스 데모 데이터(`STORAGE_KEY`)와 분리.
- **타입**: `AdminRole`, `AdminAccessState` (`src/lib/types.ts`). 헬퍼·권한 판별: `src/lib/admin-access.ts`.
- **목록 필터**: `scopeAdminLists` (`src/lib/admin-scope.ts`) → 컨텍스트의 **`adminLists`**. 고객 마케팅 화면은 전체 **`state`** 유지.
- **UI**: `AdminChrome` 상단에서 역할 전환 + (본사/재무/읽기 전용) **지점 필터**. 지점 관리자·영업은 **김해(`br-gimhae`) 소속 고정**(프리셋).

### 권한 매트릭스 (데모)

| 작업 | 허용 역할 |
|------|-----------|
| 차량·계약 생성/수정 | `hq_admin`, `branch_admin` |
| 신청·상담 메모/상태 | `hq_admin`, `branch_admin`, `sales_manager` |
| 납부 수정·입금확인 | `hq_admin`, `finance_manager` |
| 회원 등록/수정 | `hq_admin`, `branch_admin` |
| 업체/지점 마스터 편집 | `hq_admin` |
| 데모 초기화 | `hq_admin` |
| 미납 mock 동기화 | `hq_admin`, `finance_manager` |
| 읽기 전용 | 위 수정 작업 전부 UI 비활성 + 컨텍스트 가드 |

## 기능 맵 (구현 경로)

- **대시보드** `/admin` — 스코프 반영 지표, mock 푸시 로그(연결 계약이 스코프에 있을 때), **미납 동기화**
- **고객 신청** `/admin/applications` — 타임라인, 계약 생성(지점·역할 검증)
- **상담** `/admin/consultations` — 동일 데이터, 메모
- **회원** `/admin/customers` — 등록/수정
- **차량 등록** `/admin/vehicles/new`
- **차량 관리** `/admin/vehicles`
- **계약** `/admin/contracts` — `active` 전환 시 **월별 납부 스케줄 자동 생성** (`generatePaymentScheduleForContract`)
- **납부** `/admin/payments` — 입금확인, 일정·상태
- **업체·에이전시·지점** `/admin/company`

## 신청 → 계약 (2차)

| 규칙 | 설명 |
|------|------|
| 생성 조건 | 신청 상태 `reviewing` 또는 `approved` |
| 중복 방지 | `Application.linkedContractId` 존재 시 버튼 비활성 |
| 차량 검증 | 희망 차량 필수, 마스터에 존재, `hidden` 불가 |
| 4차 지점 정합 | 신청·고객·희망 차량의 **`branchId` 일치** (컨텍스트에서 검증) |
| 생성 후 | 신청 `contracted`, 계약 `pending`, 차량 reconcile |

구현: `getCreateContractFromApplicationError` / `applyCreateContractFromApplication` (`src/lib/contract-from-application.ts`).

## 차량·계약 동기화 (중앙 규칙)

- **`src/lib/vehicle-contract-sync.ts`** — `resolveVehicleStatusFromContracts`, `reconcileVehicleStatuses`
- 계약 생성·수정 시 reducer에서 **항상 reconcile** 호출.
- `hidden` / `maintenance` 차량은 자동 동기화에서 제외.

## 안정성 원칙

1. **숫자**: 원 단위 정수, UI 입력은 `Number` 검증 후 `Math.round`.
2. **상태 변경**: select로 enum만 허용; 잘못된 값은 context에서 무시.
3. **권한 분리**: mock RBAC + 지점 스코프 (`admin-access.ts`, `demo-data-context.tsx` 가드).
4. **감사 로그**: `auditLogs` 배열에 주요 이벤트 적재.
5. **위험 작업**: 삭제·데모 초기화·계약 생성은 **ConfirmDialog** 후 실행.
6. **고객 타임라인**: `buildApplicationTimeline`.
7. **미납·알림 mock**: `src/lib/mock-automations.ts`.

## 3차 요약 (고객 사용성 + 운영 자동화 mock)

| 영역 | 구현 요지 |
|------|-----------|
| 차량 등록 | `/admin/vehicles/new` + `mockVehicleCatalog` |
| 입금 확인 | `CONFIRM_DEPOSIT` |
| 자동이체 | `Contract.autodebitStatus` |
| 대시보드 | 지표 카드 + 위험 배너 |

## 4차 요약 (안정화)

| 영역 | 구현 요지 |
|------|-----------|
| RBAC | `AdminRole` + 세션 `AdminAccessState` |
| 지점 | 엔티티 `branchId`, `normalizeLegacyDemoState` |
| 납부 스케줄 | `src/lib/payment-schedule.ts`, `active` 전환 시 생성 |
| 계약 종료 | `completed`/`cancelled` 시 잔여 `scheduled` → `waived` (mock 정책) |
