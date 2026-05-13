import type { Application, Contract, PaymentRecord } from "./types";

export type TimelinePhase =
  | "received"
  | "consult"
  | "review"
  | "approved"
  | "contract_created"
  | "contract_running"
  | "payment"
  | "closed";

export interface TimelineRow {
  phase: TimelinePhase;
  title: string;
  at: string | null;
  detail?: string;
  done: boolean;
}

function firstTransitionTo(
  app: Application,
  statuses: Application["status"][],
): string | null {
  const hit = app.statusLog.find((e) => statuses.includes(e.to));
  return hit?.at ?? null;
}

/**
 * 신청·연결 계약·납부 mock 데이터로 고객 여정 타임라인을 구성합니다.
 */
export function buildApplicationTimeline(
  app: Application,
  contract: Contract | null,
  payments: PaymentRecord[],
): TimelineRow[] {
  const receivedAt = app.createdAt;
  const consultAt = firstTransitionTo(app, [
    "contacted",
    "reviewing",
    "approved",
    "contracted",
  ]);
  const reviewAt = firstTransitionTo(app, ["reviewing", "approved", "contracted"]);
  const approvedAt = firstTransitionTo(app, ["approved", "contracted"]);
  const contractCreatedAt = contract ? contract.startDate : null;
  const running =
    !!contract &&
    (contract.status === "active" || contract.status === "overdue");
  const paidRows = contract
    ? payments.filter((p) => p.contractId === contract.id && p.status === "paid")
    : [];
  const paymentAt =
    paidRows.length > 0
      ? paidRows.map((p) => p.dueDate).sort().reverse()[0] ?? null
      : null;

  const cancelLog = app.statusLog.filter((l) => l.to === "cancelled");
  const closedAt =
    app.status === "cancelled"
      ? cancelLog[cancelLog.length - 1]?.at ?? null
      : contract && (contract.status === "completed" || contract.status === "cancelled")
        ? contract.endDate
        : null;

  const hasContract = !!contract;
  const paid = !!paymentAt;
  const closed =
    app.status === "cancelled" ||
    (!!contract &&
      (contract.status === "completed" || contract.status === "cancelled"));

  return [
    {
      phase: "received",
      title: "신청 접수",
      at: receivedAt,
      detail: app.mockRef,
      done: true,
    },
    {
      phase: "consult",
      title: "상담 진행",
      at: consultAt,
      done: !!consultAt || app.status !== "new",
    },
    {
      phase: "review",
      title: "심사",
      at: reviewAt,
      done: !!reviewAt || ["reviewing", "approved", "contracted"].includes(app.status),
    },
    {
      phase: "approved",
      title: "승인",
      at: approvedAt,
      done: !!approvedAt || app.status === "contracted",
    },
    {
      phase: "contract_created",
      title: "계약 생성",
      at: contractCreatedAt,
      detail: contract?.id,
      done: hasContract,
    },
    {
      phase: "contract_running",
      title: "계약 진행",
      at: running ? contract?.startDate ?? null : null,
      detail: contract?.status,
      done: running,
    },
    {
      phase: "payment",
      title: "납부",
      at: paymentAt,
      done: paid,
    },
    {
      phase: "closed",
      title: "완료 / 취소",
      at: closedAt,
      detail:
        app.status === "cancelled"
          ? "신청 취소"
          : contract?.status === "completed"
            ? "계약 완료"
            : contract?.status === "cancelled"
              ? "계약 취소"
              : undefined,
      done: closed,
    },
  ];
}
