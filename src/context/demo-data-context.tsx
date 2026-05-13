"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  applyCreateContractFromApplication,
  getAddApplicationVehicleError,
  getCreateContractFromApplicationError,
} from "@/lib/contract-from-application";
import { STORAGE_KEY, DEFAULT_DEMO_BRANCH_ID, ADMIN_ACCESS_STORAGE_KEY } from "@/lib/constants";
import { initialDemoState } from "@/lib/mock-seed";
import { applyRunMockAutomations, customerPhoneMatchesContract } from "@/lib/mock-automations";
import { generatePaymentScheduleForContract } from "@/lib/payment-schedule";
import { reconcileVehicleStatuses } from "@/lib/vehicle-contract-sync";
import { normalizeLegacyDemoState } from "@/lib/demo-state-normalize";
import { scopeAdminLists, type AdminScopedLists } from "@/lib/admin-scope";
import {
  canAccessEntityBranch,
  canCreateContractFromApplication,
  canDeleteVehicle,
  canEditApplications,
  canEditVehicleOrContract,
  canManageCustomers,
  canMutatePayments,
  canResetDemo,
  canRunMockAutomations,
  canUpdateCompany,
  DEFAULT_ADMIN_ACCESS,
  isAdminRole,
  isReadonlyRole,
} from "@/lib/admin-access";
import type {
  AdminAccessState,
  AdminRole,
  Application,
  ApplicationStatus,
  AuditLogEntry,
  AutodebitStatus,
  CompanyProfile,
  Contract,
  ContractStatus,
  Customer,
  CustomerType,
  DemoState,
  PaymentRecord,
  PaymentRecordStatus,
  Vehicle,
  VehicleStatus,
} from "@/lib/types";

type Action =
  | { type: "HYDRATE"; payload: DemoState }
  | { type: "RESET_DEMO" }
  | { type: "ADD_APPLICATION"; payload: Application }
  | {
      type: "UPDATE_APPLICATION";
      id: string;
      patch: Partial<Pick<Application, "status" | "memo">>;
      actor: string;
    }
  | { type: "ADD_CUSTOMER"; payload: Customer }
  | { type: "UPDATE_CUSTOMER"; id: string; patch: Partial<Customer> }
  | { type: "ADD_VEHICLE"; payload: Vehicle }
  | { type: "UPDATE_VEHICLE"; id: string; patch: Partial<Vehicle> }
  | { type: "DELETE_VEHICLE"; id: string }
  | { type: "ADD_CONTRACT"; payload: Contract }
  | {
      type: "UPDATE_CONTRACT";
      id: string;
      patch: Partial<Contract>;
      actor: string;
    }
  | {
      type: "UPDATE_PAYMENT";
      id: string;
      patch: Partial<
        Pick<
          PaymentRecord,
          | "status"
          | "dueDate"
          | "amountWon"
          | "depositConfirmedAt"
          | "overdueNotifiedAt"
        >
      >;
      actor: string;
    }
  | { type: "UPDATE_COMPANY"; payload: Partial<CompanyProfile>; actor: string }
  | {
      type: "CREATE_CONTRACT_FROM_APPLICATION";
      applicationId: string;
      customerId: string;
      actor: string;
    }
  | { type: "CONFIRM_DEPOSIT"; paymentId: string; actor: string }
  | { type: "RUN_MOCK_AUTOMATIONS"; actor: string }
  | {
      type: "CUSTOMER_REQUEST_AUTODEBIT";
      contractId: string;
      phone: string;
      actor: string;
    };

function pushAudit(
  state: DemoState,
  entry: Omit<AuditLogEntry, "id" | "at"> & { id?: string; at?: string },
): DemoState {
  const log: AuditLogEntry = {
    id: entry.id ?? `al-${Math.random().toString(36).slice(2, 10)}`,
    at: entry.at ?? new Date().toISOString(),
    actor: entry.actor,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    detail: entry.detail,
  };
  return { ...state, auditLogs: [log, ...state.auditLogs].slice(0, 200) };
}

function isApplicationStatus(v: string): v is ApplicationStatus {
  return (
    v === "new" ||
    v === "contacted" ||
    v === "reviewing" ||
    v === "approved" ||
    v === "contracted" ||
    v === "cancelled"
  );
}

function isContractStatus(v: string): v is ContractStatus {
  return (
    v === "pending" ||
    v === "reviewing" ||
    v === "approved" ||
    v === "active" ||
    v === "overdue" ||
    v === "completed" ||
    v === "cancelled"
  );
}

function isAutodebitStatus(v: string): v is AutodebitStatus {
  return (
    v === "not_registered" ||
    v === "requested" ||
    v === "active" ||
    v === "failed" ||
    v === "cancelled"
  );
}

function mergeDemoState(parsed: unknown): DemoState {
  if (!parsed || typeof parsed !== "object") {
    return normalizeLegacyDemoState(initialDemoState);
  }
  const p = parsed as Partial<DemoState>;
  const co = p.company as Partial<CompanyProfile> | undefined;
  const merged: DemoState = {
    ...initialDemoState,
    ...p,
    company: {
      ...initialDemoState.company,
      ...(co ?? {}),
      branches:
        Array.isArray(co?.branches) && co.branches.length > 0
          ? co.branches
          : initialDemoState.company.branches,
    },
    vehicles: Array.isArray(p.vehicles) ? p.vehicles : initialDemoState.vehicles,
    customers: Array.isArray(p.customers)
      ? p.customers
      : initialDemoState.customers,
    applications: Array.isArray(p.applications)
      ? p.applications.map((a) => ({
          ...a,
          linkedContractId:
            (a as Application).linkedContractId === null
              ? undefined
              : (a as Application).linkedContractId,
        }))
      : initialDemoState.applications,
    contracts: Array.isArray(p.contracts)
      ? p.contracts.map((c) => ({
          ...c,
          autodebitStatus:
            (c as Contract).autodebitStatus ?? "not_registered",
        }))
      : initialDemoState.contracts,
    payments: Array.isArray(p.payments)
      ? p.payments.map((pay) => ({
          ...pay,
          depositConfirmedAt: (pay as PaymentRecord).depositConfirmedAt,
          overdueNotifiedAt: (pay as PaymentRecord).overdueNotifiedAt,
        }))
      : initialDemoState.payments,
    auditLogs: Array.isArray(p.auditLogs)
      ? p.auditLogs
      : initialDemoState.auditLogs,
    notificationLogs: Array.isArray(p.notificationLogs)
      ? p.notificationLogs
      : initialDemoState.notificationLogs,
  };
  return normalizeLegacyDemoState(merged);
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "HYDRATE":
      return mergeDemoState(action.payload);
    case "RESET_DEMO":
      return normalizeLegacyDemoState(initialDemoState);
    case "ADD_APPLICATION": {
      return pushAudit(
        { ...state, applications: [action.payload, ...state.applications] },
        {
          actor: "customer",
          action: "application.create",
          entityType: "application",
          entityId: action.payload.id,
          detail: action.payload.mockRef,
        },
      );
    }
    case "UPDATE_APPLICATION": {
      const prevApp = state.applications.find((a) => a.id === action.id);
      const next = state.applications.map((a) => {
        if (a.id !== action.id) return a;
        const prevStatus = a.status;
        const nextStatus = action.patch.status ?? a.status;
        const statusLog =
          action.patch.status && action.patch.status !== prevStatus
            ? [
                ...a.statusLog,
                {
                  at: new Date().toISOString(),
                  from: prevStatus,
                  to: nextStatus,
                  by: action.actor,
                },
              ]
            : a.statusLog;
        return { ...a, ...action.patch, statusLog };
      });
      const shouldAudit =
        action.patch.status !== undefined &&
        !!prevApp &&
        prevApp.status !== action.patch.status;
      const nextState = { ...state, applications: next };
      return shouldAudit
        ? pushAudit(nextState, {
            actor: action.actor,
            action: "application.update",
            entityType: "application",
            entityId: action.id,
            detail: JSON.stringify(action.patch),
          })
        : nextState;
    }
    case "ADD_CUSTOMER":
      return pushAudit(
        { ...state, customers: [action.payload, ...state.customers] },
        {
          actor: "admin",
          action: "customer.create",
          entityType: "customer",
          entityId: action.payload.id,
        },
      );
    case "UPDATE_CUSTOMER": {
      const next = state.customers.map((c) =>
        c.id === action.id ? { ...c, ...action.patch } : c,
      );
      return pushAudit(
        { ...state, customers: next },
        {
          actor: "admin",
          action: "customer.update",
          entityType: "customer",
          entityId: action.id,
        },
      );
    }
    case "ADD_VEHICLE": {
      const v: Vehicle = {
        ...action.payload,
        branchId: action.payload.branchId ?? DEFAULT_DEMO_BRANCH_ID,
      };
      return pushAudit(
        { ...state, vehicles: [v, ...state.vehicles] },
        {
          actor: "admin",
          action: "vehicle.create",
          entityType: "vehicle",
          entityId: v.id,
        },
      );
    }
    case "UPDATE_VEHICLE": {
      const next = state.vehicles.map((v) =>
        v.id === action.id ? { ...v, ...action.patch } : v,
      );
      return pushAudit(
        { ...state, vehicles: next },
        {
          actor: "admin",
          action: "vehicle.update",
          entityType: "vehicle",
          entityId: action.id,
        },
      );
    }
    case "DELETE_VEHICLE": {
      return pushAudit(
        { ...state, vehicles: state.vehicles.filter((v) => v.id !== action.id) },
        {
          actor: "admin",
          action: "vehicle.delete",
          entityType: "vehicle",
          entityId: action.id,
        },
      );
    }
    case "ADD_CONTRACT": {
      const payload: Contract = {
        ...action.payload,
        autodebitStatus: action.payload.autodebitStatus ?? "not_registered",
        branchId: action.payload.branchId ?? DEFAULT_DEMO_BRANCH_ID,
      };
      let nextState: DemoState = {
        ...state,
        contracts: [payload, ...state.contracts],
      };
      let scheduleCount = 0;
      if (payload.status === "active") {
        const gen = generatePaymentScheduleForContract(
          payload,
          nextState.payments,
          () => `pay-${Math.random().toString(36).slice(2, 10)}`,
        );
        scheduleCount = gen.length;
        if (gen.length) {
          nextState = { ...nextState, payments: [...gen, ...nextState.payments] };
        }
      }
      nextState = {
        ...nextState,
        vehicles: reconcileVehicleStatuses(nextState.vehicles, nextState.contracts),
      };
      let audited = pushAudit(nextState, {
        actor: "admin",
        action: "contract.create",
        entityType: "contract",
        entityId: payload.id,
      });
      if (scheduleCount > 0) {
        audited = pushAudit(audited, {
          actor: "admin",
          action: "contract.payment_schedule_generated",
          entityType: "contract",
          entityId: payload.id,
          detail: String(scheduleCount),
        });
      }
      return audited;
    }
    case "UPDATE_CONTRACT": {
      const prev = state.contracts.find((c) => c.id === action.id);
      if (!prev) return state;
      const merged: Contract = { ...prev, ...action.patch };
      const nextContracts = state.contracts.map((c) =>
        c.id === action.id ? merged : c,
      );
      const auditKeys = new Set([
        "status",
        "startDate",
        "endDate",
        "monthlyDueDay",
        "monthlyPaymentWon",
        "depositWon",
        "customerId",
        "vehicleId",
        "autodebitStatus",
        "branchId",
      ]);
      const shouldAudit = Object.keys(action.patch).some((k) =>
        auditKeys.has(k),
      );

      let paymentList = state.payments;
      const becameTerminal =
        (merged.status === "completed" || merged.status === "cancelled") &&
        prev.status !== "completed" &&
        prev.status !== "cancelled";
      if (becameTerminal) {
        paymentList = paymentList.map((p) =>
          p.contractId === action.id && p.status === "scheduled"
            ? { ...p, status: "waived" as const }
            : p,
        );
      }

      let newGenCount = 0;
      const becameActive = merged.status === "active" && prev.status !== "active";
      if (becameActive) {
        const gen = generatePaymentScheduleForContract(
          merged,
          paymentList,
          () => `pay-${Math.random().toString(36).slice(2, 10)}`,
        );
        newGenCount = gen.length;
        if (gen.length) {
          paymentList = [...gen, ...paymentList];
        }
      }

      let nextState: DemoState = {
        ...state,
        contracts: nextContracts,
        payments: paymentList,
      };
      nextState = {
        ...nextState,
        vehicles: reconcileVehicleStatuses(nextState.vehicles, nextState.contracts),
      };
      if (becameTerminal) {
        nextState = pushAudit(nextState, {
          actor: action.actor,
          action: "payment.waive_scheduled_on_contract_close",
          entityType: "contract",
          entityId: action.id,
        });
      }
      if (newGenCount > 0) {
        nextState = pushAudit(nextState, {
          actor: action.actor,
          action: "contract.payment_schedule_generated",
          entityType: "contract",
          entityId: action.id,
          detail: String(newGenCount),
        });
      }
      if (shouldAudit) {
        nextState = pushAudit(nextState, {
          actor: action.actor,
          action: "contract.update",
          entityType: "contract",
          entityId: action.id,
          detail: JSON.stringify(action.patch),
        });
      }
      return nextState;
    }
    case "CREATE_CONTRACT_FROM_APPLICATION": {
      const err = getCreateContractFromApplicationError(state, {
        applicationId: action.applicationId,
        customerId: action.customerId,
        actor: action.actor,
      });
      if (err) return state;
      const nextState = applyCreateContractFromApplication(state, {
        applicationId: action.applicationId,
        customerId: action.customerId,
        actor: action.actor,
      });
      const created = nextState.contracts[0];
      return pushAudit(nextState, {
        actor: action.actor,
        action: "contract.create_from_application",
        entityType: "application",
        entityId: action.applicationId,
        detail: created?.id,
      });
    }
    case "CONFIRM_DEPOSIT": {
      const pay = state.payments.find((p) => p.id === action.paymentId);
      if (!pay || pay.status === "paid") return state;
      const now = new Date().toISOString();
      const nextPayments = state.payments.map((p) =>
        p.id === action.paymentId
          ? {
              ...p,
              status: "paid" as const,
              depositConfirmedAt: p.depositConfirmedAt ?? now,
            }
          : p,
      );
      let nextState = pushAudit(
        { ...state, payments: nextPayments },
        {
          actor: action.actor,
          action: "payment.deposit_confirm",
          entityType: "payment",
          entityId: action.paymentId,
        },
      );
      nextState = {
        ...nextState,
        notificationLogs: [
          {
            id: `ntf-${Math.random().toString(36).slice(2, 10)}`,
            at: now,
            channel: "mock_push" as const,
            title: "입금 확인(데모)",
            body: `납부 건이 입금 확인 처리되었습니다. (실제 발송 없음)`,
            paymentId: action.paymentId,
            contractId: pay.contractId,
          },
          ...nextState.notificationLogs,
        ].slice(0, 100),
      };
      return nextState;
    }
    case "RUN_MOCK_AUTOMATIONS": {
      const nextState = applyRunMockAutomations(state);
      return pushAudit(nextState, {
        actor: action.actor,
        action: "system.mock_automations",
        entityType: "system",
        entityId: "payments",
      });
    }
    case "CUSTOMER_REQUEST_AUTODEBIT": {
      const ct = state.contracts.find((c) => c.id === action.contractId);
      if (!ct) return state;
      if (!customerPhoneMatchesContract(state, action.contractId, action.phone))
        return state;
      if (
        ct.autodebitStatus === "active" ||
        ct.autodebitStatus === "requested"
      ) {
        return state;
      }
      const next = state.contracts.map((c) =>
        c.id === action.contractId
          ? { ...c, autodebitStatus: "requested" as const }
          : c,
      );
      return pushAudit(
        { ...state, contracts: next },
        {
          actor: action.actor,
          action: "contract.autodebit_request",
          entityType: "contract",
          entityId: action.contractId,
        },
      );
    }
    case "UPDATE_PAYMENT": {
      const next = state.payments.map((p) => {
        if (p.id !== action.id) return p;
        const patch: Partial<PaymentRecord> = { ...action.patch };
        if (patch.status === "paid" && !p.depositConfirmedAt) {
          patch.depositConfirmedAt = new Date().toISOString();
        }
        return { ...p, ...patch };
      });
      return pushAudit(
        { ...state, payments: next },
        {
          actor: action.actor,
          action: "payment.update",
          entityType: "payment",
          entityId: action.id,
        },
      );
    }
    case "UPDATE_COMPANY":
      return { ...state, company: { ...state.company, ...action.payload } };
    default:
      return state;
  }
}

interface DemoContextValue {
  state: DemoState;
  /** 관리자 목록용 지점·RBAC 필터 (고객 화면은 `state` 전체 사용) */
  adminLists: AdminScopedLists;
  adminAccess: AdminAccessState;
  setAdminAccess: (patch: Partial<AdminAccessState>) => void;
  hydrated: boolean;
  dispatch: React.Dispatch<Action>;
  addApplication: (
    input: Omit<
      Application,
      | "id"
      | "createdAt"
      | "statusLog"
      | "mockRef"
      | "status"
      | "memo"
      | "linkedContractId"
      | "branchId"
    >,
  ) => AddApplicationResult;
  updateApplication: (
    id: string,
    patch: Partial<Pick<Application, "status" | "memo">>,
  ) => void;
  addCustomer: (
    input: Omit<Customer, "id" | "createdAt" | "branchId"> & {
      branchId?: string;
    },
  ) => string;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addVehicle: (input: Omit<Vehicle, "id" | "branchId">) => void;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addContract: (input: Omit<Contract, "id">) => void;
  updateContract: (id: string, patch: Partial<Contract>) => void;
  updatePayment: (
    id: string,
    patch: Partial<
      Pick<
        PaymentRecord,
        | "status"
        | "dueDate"
        | "amountWon"
        | "depositConfirmedAt"
        | "overdueNotifiedAt"
      >
    >,
  ) => void;
  updateCompany: (patch: Partial<CompanyProfile>) => void;
  createContractFromApplication: (
    applicationId: string,
    customerId: string,
  ) => CreateContractFromApplicationResult;
  confirmDeposit: (paymentId: string) => void;
  runMockAutomations: () => void;
  customerRequestAutodebit: (contractId: string, phone: string) => void;
  resetDemo: () => void;
  parseApplicationStatus: (raw: string) => ApplicationStatus | null;
  parseContractStatus: (raw: string) => ContractStatus | null;
  parseVehicleStatus: (raw: string) => VehicleStatus | null;
  parsePaymentStatus: (raw: string) => PaymentRecordStatus | null;
  parseCustomerType: (raw: string) => CustomerType | null;
  parseAutodebitStatus: (raw: string) => AutodebitStatus | null;
  parseAdminRole: (raw: string) => AdminRole | null;
}

export type AddApplicationResult =
  | { ok: true; mockRef: string }
  | { ok: false; error: string };

export type CreateContractFromApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

const DemoDataContext = createContext<DemoContextValue | null>(null);

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextMockRef(apps: Application[]) {
  const n = apps.length + 1;
  return `GR-2026-${String(n).padStart(5, "0")}`;
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialDemoState);
  const [hydrated, setHydrated] = useState(false);
  const [adminAccess, setAdminAccessState] = useState<AdminAccessState>(() => {
    if (typeof window === "undefined") return DEFAULT_ADMIN_ACCESS;
    try {
      const raw = sessionStorage.getItem(ADMIN_ACCESS_STORAGE_KEY);
      if (!raw) return DEFAULT_ADMIN_ACCESS;
      const p = JSON.parse(raw) as Partial<AdminAccessState>;
      if (p?.role && isAdminRole(p.role)) {
        return {
          role: p.role,
          assignedBranchId:
            typeof p.assignedBranchId === "string"
              ? p.assignedBranchId
              : null,
          filterBranchId:
            typeof p.filterBranchId === "string" ? p.filterBranchId : null,
        };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_ADMIN_ACCESS;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(
        ADMIN_ACCESS_STORAGE_KEY,
        JSON.stringify(adminAccess),
      );
    } catch {
      /* ignore */
    }
  }, [adminAccess]);

  const setAdminAccess = useCallback((patch: Partial<AdminAccessState>) => {
    setAdminAccessState((prev) => ({ ...prev, ...patch }));
  }, []);

  const adminLists = useMemo(
    () => scopeAdminLists(state, adminAccess),
    [state, adminAccess],
  );

  const resolveNewEntityBranchId = useCallback((): string => {
    if (adminAccess.role === "branch_admin") {
      return adminAccess.assignedBranchId ?? DEFAULT_DEMO_BRANCH_ID;
    }
    return adminAccess.filterBranchId ?? DEFAULT_DEMO_BRANCH_ID;
  }, [adminAccess]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw)
          dispatch({ type: "HYDRATE", payload: JSON.parse(raw) as DemoState });
      } catch {
        /* ignore */
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const updateApplication = useCallback(
    (id: string, patch: Partial<Pick<Application, "status" | "memo">>) => {
      if (!canEditApplications(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const app = state.applications.find((a) => a.id === id);
      if (!app || !canAccessEntityBranch(adminAccess, app.branchId)) return;
      dispatch({ type: "UPDATE_APPLICATION", id, patch, actor: "admin" });
    },
    [adminAccess, state.applications],
  );

  const addCustomer = useCallback(
    (
      input: Omit<Customer, "id" | "createdAt" | "branchId"> & {
        branchId?: string;
      },
    ) => {
      if (!canManageCustomers(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return "";
      const customer: Customer = {
        ...input,
        branchId: input.branchId ?? resolveNewEntityBranchId(),
        id: newId("cust"),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_CUSTOMER", payload: customer });
      return customer.id;
    },
    [adminAccess, resolveNewEntityBranchId],
  );

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>) => {
      if (!canManageCustomers(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const c = state.customers.find((x) => x.id === id);
      if (!c || !canAccessEntityBranch(adminAccess, c.branchId)) return;
      dispatch({ type: "UPDATE_CUSTOMER", id, patch });
    },
    [adminAccess, state.customers],
  );

  const addVehicle = useCallback(
    (input: Omit<Vehicle, "id" | "branchId">) => {
      if (!canEditVehicleOrContract(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const vehicle: Vehicle = {
        ...input,
        branchId: resolveNewEntityBranchId(),
        id: newId("veh"),
      };
      dispatch({ type: "ADD_VEHICLE", payload: vehicle });
    },
    [adminAccess, resolveNewEntityBranchId],
  );

  const updateVehicle = useCallback(
    (id: string, patch: Partial<Vehicle>) => {
      if (!canEditVehicleOrContract(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const v = state.vehicles.find((x) => x.id === id);
      if (!v || !canAccessEntityBranch(adminAccess, v.branchId)) return;
      dispatch({ type: "UPDATE_VEHICLE", id, patch });
    },
    [adminAccess, state.vehicles],
  );

  const deleteVehicle = useCallback(
    (id: string) => {
      if (!canDeleteVehicle(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const v = state.vehicles.find((x) => x.id === id);
      if (!v || !canAccessEntityBranch(adminAccess, v.branchId)) return;
      dispatch({ type: "DELETE_VEHICLE", id });
    },
    [adminAccess, state.vehicles],
  );

  const addContract = useCallback(
    (input: Omit<Contract, "id">) => {
      if (!canEditVehicleOrContract(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const branchId = input.branchId ?? resolveNewEntityBranchId();
      if (!canAccessEntityBranch(adminAccess, branchId)) return;
      const contract: Contract = { ...input, branchId, id: newId("ctr") };
      dispatch({ type: "ADD_CONTRACT", payload: contract });
    },
    [adminAccess, resolveNewEntityBranchId],
  );

  const updateContract = useCallback(
    (id: string, patch: Partial<Contract>) => {
      if (!canEditVehicleOrContract(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const ct = state.contracts.find((c) => c.id === id);
      if (!ct || !canAccessEntityBranch(adminAccess, ct.branchId)) return;
      dispatch({ type: "UPDATE_CONTRACT", id, patch, actor: "admin" });
    },
    [adminAccess, state.contracts],
  );

  const updatePayment = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          PaymentRecord,
          | "status"
          | "dueDate"
          | "amountWon"
          | "depositConfirmedAt"
          | "overdueNotifiedAt"
        >
      >,
    ) => {
      if (!canMutatePayments(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const p = state.payments.find((x) => x.id === id);
      if (!p || !canAccessEntityBranch(adminAccess, p.branchId)) return;
      dispatch({ type: "UPDATE_PAYMENT", id, patch, actor: "admin" });
    },
    [adminAccess, state.payments],
  );

  const confirmDeposit = useCallback(
    (paymentId: string) => {
      if (!canMutatePayments(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      const p = state.payments.find((x) => x.id === paymentId);
      if (!p || !canAccessEntityBranch(adminAccess, p.branchId)) return;
      dispatch({ type: "CONFIRM_DEPOSIT", paymentId, actor: "admin" });
    },
    [adminAccess, state.payments],
  );

  const runMockAutomations = useCallback(() => {
    if (!canRunMockAutomations(adminAccess.role) || isReadonlyRole(adminAccess.role))
      return;
    dispatch({ type: "RUN_MOCK_AUTOMATIONS", actor: "admin" });
  }, [adminAccess]);

  const customerRequestAutodebit = useCallback(
    (contractId: string, phone: string) => {
      dispatch({
        type: "CUSTOMER_REQUEST_AUTODEBIT",
        contractId,
        phone,
        actor: "customer",
      });
    },
    [],
  );

  const updateCompany = useCallback(
    (patch: Partial<CompanyProfile>) => {
      if (!canUpdateCompany(adminAccess.role) || isReadonlyRole(adminAccess.role))
        return;
      dispatch({ type: "UPDATE_COMPANY", payload: patch, actor: "admin" });
    },
    [adminAccess],
  );

  const resetDemo = useCallback(() => {
    if (!canResetDemo(adminAccess.role)) return;
    dispatch({ type: "RESET_DEMO" });
  }, [adminAccess]);

  const createContractFromApplication = useCallback(
    (
      applicationId: string,
      customerId: string,
    ): CreateContractFromApplicationResult => {
      if (
        !canCreateContractFromApplication(adminAccess.role) ||
        isReadonlyRole(adminAccess.role)
      ) {
        return { ok: false, error: "계약 생성 권한이 없습니다." };
      }
      const app = state.applications.find((a) => a.id === applicationId);
      const cust = state.customers.find((c) => c.id === customerId);
      if (!app || !canAccessEntityBranch(adminAccess, app.branchId)) {
        return { ok: false, error: "신청을 찾을 수 없거나 지점 범위를 벗어났습니다." };
      }
      if (!cust || !canAccessEntityBranch(adminAccess, cust.branchId)) {
        return { ok: false, error: "고객을 찾을 수 없거나 지점 범위를 벗어났습니다." };
      }
      if (cust.branchId !== app.branchId) {
        return { ok: false, error: "고객 지점과 신청 지점이 일치하지 않습니다." };
      }
      const veh = app.preferredVehicleId
        ? state.vehicles.find((v) => v.id === app.preferredVehicleId)
        : undefined;
      if (veh && veh.branchId !== app.branchId) {
        return { ok: false, error: "차량 소속 지점과 신청 지점이 일치하지 않습니다." };
      }
      const err = getCreateContractFromApplicationError(state, {
        applicationId,
        customerId,
        actor: "admin",
      });
      if (err) return { ok: false, error: err };
      dispatch({
        type: "CREATE_CONTRACT_FROM_APPLICATION",
        applicationId,
        customerId,
        actor: "admin",
      });
      return { ok: true };
    },
    [state, adminAccess],
  );

  const addApplication = useCallback(
    (
      input: Omit<
        Application,
        | "id"
        | "createdAt"
        | "statusLog"
        | "mockRef"
        | "status"
        | "memo"
        | "linkedContractId"
        | "branchId"
      >,
    ): AddApplicationResult => {
      const vehErr = getAddApplicationVehicleError(state, input.preferredVehicleId);
      if (vehErr) return { ok: false, error: vehErr };
      const v = input.preferredVehicleId
        ? state.vehicles.find((x) => x.id === input.preferredVehicleId)
        : undefined;
      const id = newId("app");
      const mockRef = nextMockRef(state.applications);
      const createdAt = new Date().toISOString();
      const app: Application = {
        ...input,
        branchId: v?.branchId ?? DEFAULT_DEMO_BRANCH_ID,
        id,
        createdAt,
        status: "new",
        memo: "",
        statusLog: [{ at: createdAt, from: null, to: "new", by: "system" }],
        mockRef,
      };
      dispatch({ type: "ADD_APPLICATION", payload: app });
      return { ok: true, mockRef };
    },
    [state],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      adminLists,
      adminAccess,
      setAdminAccess,
      hydrated,
      dispatch,
      addApplication,
      updateApplication,
      addCustomer,
      updateCustomer,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addContract,
      updateContract,
      updatePayment,
      updateCompany,
      createContractFromApplication,
      confirmDeposit,
      runMockAutomations,
      customerRequestAutodebit,
      resetDemo,
      parseApplicationStatus: (raw) =>
        isApplicationStatus(raw) ? raw : null,
      parseContractStatus: (raw) => (isContractStatus(raw) ? raw : null),
      parseVehicleStatus: (raw) => {
        const allowed: VehicleStatus[] = [
          "available",
          "reserved",
          "contracted",
          "maintenance",
          "hidden",
        ];
        return allowed.includes(raw as VehicleStatus)
          ? (raw as VehicleStatus)
          : null;
      },
      parsePaymentStatus: (raw) => {
        const allowed: PaymentRecordStatus[] = [
          "scheduled",
          "paid",
          "overdue",
          "waived",
        ];
        return allowed.includes(raw as PaymentRecordStatus)
          ? (raw as PaymentRecordStatus)
          : null;
      },
      parseCustomerType: (raw) =>
        raw === "individual" || raw === "corporate" ? raw : null,
      parseAutodebitStatus: (raw) =>
        isAutodebitStatus(raw) ? raw : null,
      parseAdminRole: (raw) => (isAdminRole(raw) ? raw : null),
    }),
    [
      state,
      adminLists,
      adminAccess,
      setAdminAccess,
      hydrated,
      addApplication,
      updateApplication,
      addCustomer,
      updateCustomer,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addContract,
      updateContract,
      updatePayment,
      updateCompany,
      createContractFromApplication,
      confirmDeposit,
      runMockAutomations,
      customerRequestAutodebit,
      resetDemo,
    ],
  );

  return (
    <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within DemoDataProvider");
  return ctx;
}
