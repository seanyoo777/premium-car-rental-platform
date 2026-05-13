# MASTER_MANUAL — Premium Car Rental Platform

## 1. 비전

고객용 **모바일 우선** 렌트 랜딩·검색·상담 신청과, 운영 안정성을 우선하는 **관리자(/admin)** 를 한 코드베이스에서 제공합니다.  
본 버전은 **mock/demo** 이며, **실제 결제 API 및 금융 실행은 없습니다.**

## 2. 사업 메시지 (카피 기준)

- **3년 타면 인수 가능** (사업 조건은 실제 계약서·정책에 따름 — 여기서는 UI 카피)
- **전 차량 150만원 상당 패키지** (유리막·발수·가죽·생활 PPF·트랩매트) + **3년 보증** 강조
- **숨겨진 금액 없음** (투명한 가격 표기 목표)
- **법인 차량** 안정 렌트 메시지
- **김해 고객 특별 혜택**
- 업체: **가람렌트카** / 에이전시: **올인카**

## 3. 정보 구조 (고객)

| 화면 | 경로 | 내용 |
|------|------|------|
| 랜딩 | `/` | 히어로, 혜택 카드, 차량 검색 유도 |
| 차량·가격 | `/vehicles` | 차량명, 가격, 보증금, 월 납입, 계약기간, 신청 |
| 신청 | `/apply` | 이름, 연락처, 지역, 개인/법인, 희망 차량, 메모, 동의 |
| 완료 | `/apply/success` | mock 접수번호, **내 조회** 링크 |
| 내 조회 | `/lookup` | 접수번호+연락처 mock 조회, 계약·납부·자동이체·차량 요약 |

## 4. 관리자

기본 경로: **`/admin`**

- **mock RBAC**: 사이드바 상단에서 역할(`hq_admin`, `branch_admin`, `sales_manager`, `finance_manager`, `readonly`) 전환 및 지점 필터. 세션 키 `premium-car-rental-admin-access-v1`.
- 대시보드(**지표**, 스코프 반영), 신청 관리, 상담 관리, 회원 관리
- 차량 등록(`/admin/vehicles/new`) — **mock 카탈로그 자동완성**, 가격·보증금·월납 추정, 이미지 URL
- 계약 관리, 납부 관리(**입금확인** mock, **재무/본사**만), **업체·에이전시·지점** (`/admin/company`, **본사만** 편집)

**안정성 패턴**

- 금액 정수 저장, UI에서 숫자 파싱 후 `Math.round`
- 위험 작업: 차량 삭제, 데모 데이터 초기화, **신청 기반 계약 생성** → **확인 모달**
- 감사 로그: `DemoState.auditLogs` (확장 준비 완료, 주요 이벤트 기록)
- **mock 자동화**: `RUN_MOCK_AUTOMATIONS` — 만기 지난 미납 전환, mock 푸시 로그, 차량 상태 reconcile. 대시보드 진입 시 1회 실행(클라이언트).

### 입금 확인 · 미납 알림 (mock)

- 납부 **`CONFIRM_DEPOSIT`**: `paid` 고정, 이미 `paid` 면 무시, `depositConfirmedAt`·감사·`notificationLogs` 반영.
- **미납**: `applyRunMockAutomations` (`src/lib/mock-automations.ts`) — `scheduled` + 만기 경과 → `overdue`, 필요 시 mock 푸시 로그·`overdueNotifiedAt`. **실제 푸시·결제 없음.**

### 자동이체 (mock)

- `Contract.autodebitStatus`: `not_registered` | `requested` | `active` | `failed` | `cancelled`. 실제 은행/API 없음.
- 고객 `/lookup` 에서 자동이체 신청 → `requested` (검증된 연락처만, 중복 방지).
- `active` 인 계약은 고객 화면에 **다음 납부 예정일** 표시.

### 계약 `active` / 종료 (4차)

- **`active`로 처음 전환** 시: `generatePaymentScheduleForContract`로 월별 `PaymentRecord` 자동 생성(중복 `dueDate` 방지), 차량 reconcile, 감사 로그.
- **`completed` / `cancelled`**: 잔여 `scheduled` 납부를 **`waived`** 로 전환(mock 정책), 차량 reconcile.

### 지점 데이터 (4차)

- 차량·고객·신청·계약·납부에 **`branchId`**. 기본값 김해 `br-gimhae`. 구 데이터는 `normalizeLegacyDemoState`로 보정.

### 신청 → 계약 (mock 플로우)

- `/admin/applications` 에서 **심사(`reviewing`) 또는 승인(`approved`)** 인 신청만 **계약 생성** 가능.
- `linkedContractId` 가 있으면 **중복 생성 불가**.
- 희망 차량이 없거나, 차량이 없거나, `hidden` 이면 생성 불가.
- 생성 시 `Contract.applicationId` 연결, 신청 상태는 **`contracted`** 로 전환, 감사 로그 `contract.create_from_application`.

### 차량 ↔ 계약 동기화

- 로직은 **`src/lib/vehicle-contract-sync.ts`** 단일 모듈에서 산출합니다.
- 계약이 `active`/`overdue` 이면 차량 `contracted`, `pending`/`reviewing`/`approved` 이면 `reserved`, 종료(`completed`/`cancelled`)만 남으면 `available` (단, 차량이 `hidden`/`maintenance` 이면 자동 변경 제외).
- `ADD_CONTRACT` / `UPDATE_CONTRACT` / `CREATE_CONTRACT_FROM_APPLICATION` 이후 **항상 재조정(reconcile)** 됩니다.

### 지점·본사

- `CompanyProfile.branches[]` — 본사(`isHeadquarters`) + 지점(김해 기본 시드).
- `/admin/company` 에서 지점명·코드·지역 태그·특별 혜택 문구 편집.

### 고객 타임라인

- `src/lib/application-timeline.ts` 의 `buildApplicationTimeline` 으로 **신청 접수 → 상담 → 심사 → 승인 → 계약 → 진행 → 납부 → 완료/취소** 단계를 표시.
- 신청 상세(`/admin/applications`) 및 회원 상세(`/admin/customers`, 동일 연락처 신청 매칭)에서 사용.

## 5. 데이터 모델 요약

- **차량** `Vehicle`: `status` ∈ `available | reserved | contracted | maintenance | hidden`, `modelYear?`, `imageUrl`, **`branchId`**
- **고객** `Customer`: 식별·연락처·지역 등 + **`branchId`**
- **신청** `Application`: `status` + `statusLog` + **`linkedContractId?`** + **`branchId`**
- **계약** `Contract`: 상태 머신은 `docs/CONTRACT_SYSTEM.md` 참고 + **`applicationId?`** + **`autodebitStatus`** + **`branchId`**
- **납부** `PaymentRecord`: `scheduled | paid | overdue | waived` (mock) + **`depositConfirmedAt?`**, **`overdueNotifiedAt?`** + **`branchId`**
- **알림 로그** `PushNotificationLog[]` — `DemoState.notificationLogs` (mock 푸시만, 실제 발송 없음)
- **지점** `Branch`: `CompanyProfile.branches` (본사/지점, 김해 특화 문구)

## 6. 로컬 저장

- **데모 비즈니스 데이터**: `localStorage` 키 `premium-car-rental-demo-v1` (`STORAGE_KEY`).
- **관리자 mock RBAC**: `sessionStorage` 키 `premium-car-rental-admin-access-v1` (`ADMIN_ACCESS_STORAGE_KEY`).

## 7. 빌드

```bash
npm run lint
npm run build
```

## 8. 다음 단계 (권장)

- 서버 세션·실 DB (Postgres)로 **RBAC·지점 스코프 강제**
- 계약 상태 전이 **서버 사이드 검증** + 불변 이벤트 스토어
- 결제는 **PG 샌드박스** 단계부터 별도 모듈로 분리 (현재는 mock만)
- 자동이체·미납 알림은 **은행/푸시 FCM** 연동 시 별도 워커 + 멱등 키
- 신청→계약 자동화 시 **대기열·멱등 키**로 중복 방지 강화

## 9. 상세 문서

- `docs/ADMIN_STRUCTURE.md`
- `docs/CUSTOMER_SYSTEM.md`
- `docs/VEHICLE_SYSTEM.md`
- `docs/CONTRACT_SYSTEM.md`
- `docs/PAYMENT_SYSTEM.md`
- `docs/BRANCH_SYSTEM.md`
