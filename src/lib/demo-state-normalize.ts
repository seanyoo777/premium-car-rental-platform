import { DEFAULT_DEMO_BRANCH_ID } from "./constants";
import type { DemoState } from "./types";

/** 구버전 localStorage 등 `branchId` 누락 데이터 보정 */
export function normalizeLegacyDemoState(input: DemoState): DemoState {
  const def = DEFAULT_DEMO_BRANCH_ID;
  const vehicles = input.vehicles.map((v) => ({
    ...v,
    branchId: v.branchId ?? def,
  }));
  const customers = input.customers.map((c) => ({
    ...c,
    branchId: c.branchId ?? def,
  }));
  const applications = input.applications.map((a) => ({
    ...a,
    branchId: a.branchId ?? def,
  }));
  const contracts = input.contracts.map((c) => {
    const br =
      c.branchId ??
      customers.find((cu) => cu.id === c.customerId)?.branchId ??
      vehicles.find((v) => v.id === c.vehicleId)?.branchId ??
      def;
    return { ...c, branchId: br };
  });
  const payments = input.payments.map((p) => ({
    ...p,
    branchId:
      p.branchId ??
      contracts.find((ct) => ct.id === p.contractId)?.branchId ??
      def,
  }));
  return {
    ...input,
    vehicles,
    customers,
    applications,
    contracts,
    payments,
  };
}
