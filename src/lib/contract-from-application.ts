import { computeDepositWon } from "./format";
import { reconcileVehicleStatuses } from "./vehicle-contract-sync";
import type { Contract, DemoState } from "./types";

export type CreateContractFromApplicationInput = {
  applicationId: string;
  customerId: string;
  actor: string;
};

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getCreateContractFromApplicationError(
  state: DemoState,
  input: CreateContractFromApplicationInput,
): string | null {
  const app = state.applications.find((a) => a.id === input.applicationId);
  if (!app) return "신청을 찾을 수 없습니다.";
  if (app.linkedContractId) return "이미 계약이 연결된 신청입니다.";
  if (app.status !== "reviewing" && app.status !== "approved") {
    return "심사(reviewing) 또는 승인(approved) 상태에서만 계약을 생성할 수 있습니다.";
  }
  if (!app.preferredVehicleId) return "희망 차량이 없습니다. 신청에 차량을 먼저 연결하세요.";
  const vehicle = state.vehicles.find((v) => v.id === app.preferredVehicleId);
  if (!vehicle) return "희망 차량이 존재하지 않습니다.";
  if (vehicle.status === "hidden") return "비공개(hidden) 차량으로는 계약을 만들 수 없습니다.";
  const customer = state.customers.find((c) => c.id === input.customerId);
  if (!customer) return "고객을 찾을 수 없습니다.";
  return null;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * 검증 통과 시에만 호출합니다. 신청·계약·차량 동기화·감사 로그까지 반영한 다음 상태를 반환합니다.
 */
export function applyCreateContractFromApplication(
  state: DemoState,
  input: CreateContractFromApplicationInput,
): DemoState {
  const err = getCreateContractFromApplicationError(state, input);
  if (err) return state;

  const app = state.applications.find((a) => a.id === input.applicationId)!;
  const vehicle = state.vehicles.find((v) => v.id === app.preferredVehicleId)!;
  const contractId = newId("ctr");
  const now = new Date();
  const end = addDays(now, Math.max(1, vehicle.contractMonths) * 30);

  const contract: Contract = {
    id: contractId,
    customerId: input.customerId,
    vehicleId: vehicle.id,
    applicationId: app.id,
    startDate: isoDate(now),
    endDate: isoDate(end),
    monthlyDueDay: 5,
    monthlyPaymentWon: vehicle.monthlyPaymentWon,
    depositWon: computeDepositWon(vehicle.priceWon, vehicle.depositPercent),
    status: "pending",
    memo: `신청 ${app.mockRef}에서 생성(데모)`,
    autodebitStatus: "not_registered",
    branchId: app.branchId,
  };

  const statusLogTime = new Date().toISOString();
  const nextApplications = state.applications.map((a) => {
    if (a.id !== app.id) return a;
    const prevStatus = a.status;
    const nextStatus = "contracted" as const;
    return {
      ...a,
      linkedContractId: contractId,
      status: nextStatus,
      statusLog: [
        ...a.statusLog,
        {
          at: statusLogTime,
          from: prevStatus,
          to: nextStatus,
          by: input.actor,
        },
      ],
    };
  });

  let next: DemoState = {
    ...state,
    contracts: [contract, ...state.contracts],
    applications: nextApplications,
  };
  next = {
    ...next,
    vehicles: reconcileVehicleStatuses(next.vehicles, next.contracts),
  };
  return next;
}

export function getAddApplicationVehicleError(
  state: DemoState,
  preferredVehicleId?: string,
): string | null {
  if (!preferredVehicleId) return null;
  const v = state.vehicles.find((x) => x.id === preferredVehicleId);
  if (!v) return "선택한 차량이 존재하지 않습니다.";
  if (v.status === "hidden") return "비공개 차량은 신청할 수 없습니다.";
  return null;
}
