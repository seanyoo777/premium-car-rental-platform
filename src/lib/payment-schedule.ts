import type { Contract, PaymentRecord } from "./types";

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function clampDay(y: number, m: number, day: number): number {
  return Math.min(Math.max(1, day), daysInMonth(y, m));
}

function parseYmd(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return { y, m, d };
}

function formatYmd(y: number, m: number, day: number): string {
  const mm = String(m).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function addMonth(y: number, m: number): { y: number; m: number } {
  let nm = m + 1;
  let ny = y;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  return { y: ny, m: nm };
}

/**
 * 계약 시작일 이후 첫 `monthlyDueDay` 납부일(월말 클램프).
 */
export function firstDueOnOrAfter(
  startIso: string,
  monthlyDueDay: number,
): string {
  let { y, m } = parseYmd(startIso);
  const startCmp = startIso;
  for (let i = 0; i < 600; i++) {
    const day = clampDay(y, m, monthlyDueDay);
    const candidate = formatYmd(y, m, day);
    if (candidate >= startCmp) return candidate;
    ({ y, m } = addMonth(y, m));
  }
  return startCmp;
}

export function nextDueAfter(
  prevDueIso: string,
  monthlyDueDay: number,
): string {
  let { y, m } = parseYmd(prevDueIso);
  ({ y, m } = addMonth(y, m));
  const day = clampDay(y, m, monthlyDueDay);
  return formatYmd(y, m, day);
}

/**
 * 계약 `active` 시 월별 납부 스케줄(시작~종료, `monthlyDueDay` 기준).
 * 동일 `contractId`+`dueDate` 가 이미 있으면 생략(중복 방지).
 */
export function generatePaymentScheduleForContract(
  contract: Contract,
  existing: PaymentRecord[],
  newPaymentId: () => string,
): PaymentRecord[] {
  const existingDue = new Set(
    existing
      .filter((p) => p.contractId === contract.id)
      .map((p) => p.dueDate),
  );
  const out: PaymentRecord[] = [];
  let due = firstDueOnOrAfter(contract.startDate, contract.monthlyDueDay);
  const end = contract.endDate;
  let guard = 0;
  while (due <= end && guard++ < 600) {
    if (!existingDue.has(due)) {
      existingDue.add(due);
      out.push({
        id: newPaymentId(),
        contractId: contract.id,
        branchId: contract.branchId,
        dueDate: due,
        amountWon: contract.monthlyPaymentWon,
        status: "scheduled",
      });
    }
    due = nextDueAfter(due, contract.monthlyDueDay);
  }
  return out;
}
