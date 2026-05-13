import { effectiveListBranchId } from "./admin-access";
import type { AdminAccessState, DemoState } from "./types";

export type AdminScopedLists = Pick<
  DemoState,
  "vehicles" | "customers" | "applications" | "contracts" | "payments"
>;

export function scopeAdminLists(
  state: DemoState,
  access: AdminAccessState,
): AdminScopedLists {
  const eff = effectiveListBranchId(access);
  const m = (b: string) => eff === null || b === eff;
  return {
    vehicles: state.vehicles.filter((v) => m(v.branchId)),
    customers: state.customers.filter((c) => m(c.branchId)),
    applications: state.applications.filter((a) => m(a.branchId)),
    contracts: state.contracts.filter((c) => m(c.branchId)),
    payments: state.payments.filter((p) => m(p.branchId)),
  };
}
