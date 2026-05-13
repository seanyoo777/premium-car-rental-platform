import type { AdminAccessState, AdminRole } from "./types";
import { DEFAULT_DEMO_BRANCH_ID } from "./constants";

export const DEFAULT_ADMIN_ACCESS: AdminAccessState = {
  role: "hq_admin",
  assignedBranchId: null,
  filterBranchId: null,
};

export function isAdminRole(v: string): v is AdminRole {
  return (
    v === "hq_admin" ||
    v === "branch_admin" ||
    v === "sales_manager" ||
    v === "finance_manager" ||
    v === "readonly"
  );
}

export function isReadonlyRole(role: AdminRole): boolean {
  return role === "readonly";
}

/** 입금확인·납부 레코드 수정 (mock) */
export function canMutatePayments(role: AdminRole): boolean {
  return role === "hq_admin" || role === "finance_manager";
}

/** 차량·계약 마스터 수정 */
export function canEditVehicleOrContract(role: AdminRole): boolean {
  return role === "hq_admin" || role === "branch_admin";
}

export function canEditApplications(role: AdminRole): boolean {
  return (
    role === "hq_admin" ||
    role === "branch_admin" ||
    role === "sales_manager"
  );
}

export function canCreateContractFromApplication(role: AdminRole): boolean {
  return role === "hq_admin" || role === "branch_admin";
}

export function canManageCustomers(role: AdminRole): boolean {
  return role === "hq_admin" || role === "branch_admin";
}

export function canDeleteVehicle(role: AdminRole): boolean {
  return role === "hq_admin" || role === "branch_admin";
}

export function canUpdateCompany(role: AdminRole): boolean {
  return role === "hq_admin";
}

export function canResetDemo(role: AdminRole): boolean {
  return role === "hq_admin";
}

export function canRunMockAutomations(role: AdminRole): boolean {
  return role === "hq_admin" || role === "finance_manager";
}

/** UI에서 역할 전환 시 기본 소속·필터 */
export function adminRolePreset(role: AdminRole): AdminAccessState {
  if (role === "branch_admin" || role === "sales_manager") {
    return {
      role,
      assignedBranchId: DEFAULT_DEMO_BRANCH_ID,
      filterBranchId: null,
    };
  }
  return { role, assignedBranchId: null, filterBranchId: null };
}

/** 지점 역할은 소속 지점으로 고정, 그 외는 filterBranchId (null=전체) */
export function effectiveListBranchId(
  access: AdminAccessState,
): string | null {
  if (access.role === "branch_admin" || access.role === "sales_manager") {
    return access.assignedBranchId;
  }
  return access.filterBranchId;
}

export function entityMatchesBranchFilter(
  branchId: string,
  access: AdminAccessState,
): boolean {
  const eff = effectiveListBranchId(access);
  if (eff === null) return true;
  return branchId === eff;
}

export function canAccessEntityBranch(
  access: AdminAccessState,
  branchId: string,
): boolean {
  if (access.role === "branch_admin" || access.role === "sales_manager") {
    return access.assignedBranchId === branchId;
  }
  return entityMatchesBranchFilter(branchId, access);
}
