# 고객 시스템 (Customer)

## 목표

- **모바일 우선**으로 신청까지 스텝 최소화
- 가격·보증금·월 납입·계약기간 **한눈에** (`/vehicles`)
- **실제 결제 없음** — 상담 리드 생성만

## 사용자 여정

1. 랜딩 `/` — 가치 제안, 150만 패키지·3년 보증, CTA
2. 차량 검색 `/vehicles` — 필터(텍스트) + 카드
3. 신청 `/apply` — 희망 차량 프리필 가능 (`?vehicle=id`)
4. 완료 `/apply/success?ref=...` — **mock 접수번호** 및 **내 조회** 링크
5. **내 신청·계약 조회** `/lookup` — 접수번호 + 신청 시 연락처로 mock 조회 (`src/lib/customer-lookup.ts`). URL `?ref=` 로 접수번호 프리필 가능.

### 본인인증 없음 (4차)

- **누구나 접수번호·연락처를 알면 조회 가능**한 구조임을 화면에 명시합니다. 실서비스에서는 본인인증·일회성 토큰 링크가 필요합니다.
- 계약이 연결된 경우 **계약서 PDF / 전자서명** 버튼을 **read-only 더미**로 노출합니다. 실제 PDF·서명 API는 연결하지 않습니다.

## 데이터 필드 (신청)

- 이름, 연락처, 지역
- 개인/법인 (`customerType`)
- 희망 차량 (`preferredVehicleId` optional)
- **지점** `branchId` — 희망 차량이 있으면 차량의 `branchId`를 복사, 없으면 기본 김해 지점 (`DEFAULT_DEMO_BRANCH_ID`)
- **연결 계약** (`linkedContractId` — 관리자가 신청에서 계약 생성 시 설정)
- 상담 요청 메시지
- 개인정보 동의 (데모 문구)

## 신청 검증 (고객 `/apply`)

- `preferredVehicleId` 가 있으면 **차량 마스터에 존재**해야 하며 **`hidden` 차량은 신청 불가** (`getAddApplicationVehicleError`).
- 실패 시 접수번호 없이 에러 메시지만 표시합니다.

## 진행 타임라인 (관리자·mock)

- `buildApplicationTimeline` (`src/lib/application-timeline.ts`) — 접수, 상담, 심사, 승인, 계약 생성, 계약 진행, 납부, 완료/취소 단계.
- **신청 상세** `/admin/applications` 및 **회원 상세** `/admin/customers` (동일 연락처 `phoneDigits` 매칭 신청)에서 표시.

## 상태 (신청 → 운영)

고객에게 노출되는 진행 상태는 관리자의 `Application.status`와 연동됩니다.

- `new` → `contacted` → `reviewing` → `approved` → `contracted` | `cancelled`

상세는 `docs/ADMIN_STRUCTURE.md` 참고.

## 인수/반납 (향후)

고객 앱에서 **인수 완료 / 반납 예정 / 반납 완료** 타임라인을 노출하려면 `HandoverEvent` 엔티티를 추가하고 지점 관리자와 동기화합니다. 현재 버전에서는 UI 범위를 두지 않았습니다.
