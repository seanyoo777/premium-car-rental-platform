# 납부 시스템 (Payment)

## 범위

본 프로젝트는 **실제 결제 PG, 자동이체, 가상계좌 발급을 연결하지 않습니다.**  
`PaymentRecord`는 **일정·상태 추적용 mock** 입니다.

## 엔티티: `PaymentRecord`

| 필드 | 설명 |
|------|------|
| `contractId` | 연결 계약 |
| `branchId` | 소속 지점 (스케줄 생성 시 계약에서 복사) |
| `dueDate` | 납부 예정일 (ISO 날짜 문자열) |
| `amountWon` | 금액 (원, 정수) |
| `status` | `scheduled` / `paid` / `overdue` / `waived` |
| `depositConfirmedAt?` | **입금확인** 처리 시각 (mock, `CONFIRM_DEPOSIT` 또는 UI에서 `paid`로 전환 시 자동) |
| `overdueNotifiedAt?` | 미납 **mock 푸시** 로그 생성 시각 (`applyRunMockAutomations`) |

## 입금 확인 (3차 · mock)

- `/admin/payments` 에서 **입금확인** 버튼 → `CONFIRM_DEPOSIT` 액션.
- 이미 `paid` 인 건은 **중복 처리 불가** (reducer에서 early return).
- 효과: `status: paid`, `depositConfirmedAt` 설정, `auditLogs` 에 `payment.deposit_confirm`, `notificationLogs` 에 mock 푸시 1건 추가 (실제 발송 없음).

## 미납·동기화 mock (`applyRunMockAutomations`)

- `dueDate < today` 이고 `scheduled` 이면 `overdue` 로 전환 (연관 계약·알림 로그는 `src/lib/mock-automations.ts` 참고).
- 본사 대시보드(`/admin`) 진입 시 **1회** + 수동 버튼으로 `RUN_MOCK_AUTOMATIONS` 재실행 가능.

## 월별 스케줄 생성 (4차 · mock)

- 헬퍼: **`generatePaymentScheduleForContract`** (`src/lib/payment-schedule.ts`).
- 트리거: 계약 상태가 **`active`로 처음 전환될 때** (`UPDATE_CONTRACT`), 또는 **`ADD_CONTRACT` 시 이미 `active`인 경우**.
- 규칙: `firstDueOnOrAfter(startDate, monthlyDueDay)` 부터 `endDate` 이하까지 매월 1건, 금액은 `monthlyPaymentWon`. 월말은 **일자 클램프**.
- **중복 방지**: 동일 계약에 동일 `dueDate`가 이미 있으면 생성하지 않음.

## 계약 종료 시 잔여 스케줄 (4차)

- `completed` / `cancelled` 로 전환되면 해당 계약의 `scheduled` 건은 **`waived`** (`docs/CONTRACT_SYSTEM.md` 참고).

## 운영 흐름 (향후)

1. 계약 `active` 시 월별 스케줄 자동 생성 (**데모에서 위와 동일 로직 사용**)
2. 결제 성공 웹훅 수신 시 `paid`
3. 미납 시 `overdue` + 계약 `overdue` 연동

## UI

- `/admin/payments` — 행 선택 후 **입금확인**, 상태·만기일·금액 수정 (**`hq_admin` / `finance_manager`** mock RBAC, `docs/ADMIN_STRUCTURE.md`)

## RBAC (4차)

- 입금확인·납부 필드 수정은 **재무·본사**만 컨텍스트에서 허용됩니다.

## 타임라인 연동

- 고객 여정 타임라인의 **납부** 단계는 동일 계약에 대해 `status === paid` 인 레코드가 있으면 완료로 표시합니다 (`dueDate`를 완료 시각 대용으로 사용, mock 한계).

## 보안·컴플라이언스

- 실연동 시: **PCI 범위 최소화**(토큰화), PII 암호화, 접근 통제
