import { phoneDigits } from "./phone";
import { reconcileVehicleStatuses } from "./vehicle-contract-sync";
import type { ContractStatus, DemoState, PushNotificationLog } from "./types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function newNtfId() {
  return `ntf-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 만기 경과한 scheduled 납부 → overdue, 계약 active→overdue, mock 푸시 로그, 차량 reconcile
 */
export function applyRunMockAutomations(state: DemoState): DemoState {
  const today = todayIso();
  const logs: PushNotificationLog[] = [...state.notificationLogs];

  const nextPayments = state.payments.map((p) => {
    if (p.status !== "scheduled") return p;
    if (p.dueDate >= today) return p;
    const firstTime = !p.overdueNotifiedAt;
    const overdueNotifiedAt = p.overdueNotifiedAt ?? new Date().toISOString();
    if (firstTime) {
      const ct = state.contracts.find((c) => c.id === p.contractId);
      const cust = ct
        ? state.customers.find((c) => c.id === ct.customerId)
        : undefined;
      logs.unshift({
        id: newNtfId(),
        at: overdueNotifiedAt,
        channel: "mock_push",
        title: "납부 미납 알림(데모)",
        body: `납부 만기 ${p.dueDate} · 금액 ${p.amountWon.toLocaleString("ko-KR")}원 건이 미납 처리되었습니다. (실제 발송 없음)`,
        targetPhone: cust?.phone,
        contractId: p.contractId,
        paymentId: p.id,
      });
    }
    return {
      ...p,
      status: "overdue" as const,
      overdueNotifiedAt,
    };
  });

  const overdueContractIds = new Set(
    nextPayments.filter((p) => p.status === "overdue").map((p) => p.contractId),
  );

  const nextContracts = state.contracts.map((c) => {
    if (!overdueContractIds.has(c.id)) return c;
    if (c.status === "active" || c.status === "approved") {
      return { ...c, status: "overdue" as ContractStatus };
    }
    return c;
  });

  let next: DemoState = {
    ...state,
    payments: nextPayments,
    contracts: nextContracts,
    notificationLogs: logs.slice(0, 100),
  };
  next = {
    ...next,
    vehicles: reconcileVehicleStatuses(next.vehicles, next.contracts),
  };
  return next;
}

export function customerPhoneMatchesContract(
  state: DemoState,
  contractId: string,
  phone: string,
): boolean {
  const ct = state.contracts.find((c) => c.id === contractId);
  if (!ct) return false;
  const cust = state.customers.find((c) => c.id === ct.customerId);
  if (!cust) return false;
  return phoneDigits(cust.phone) === phoneDigits(phone);
}
