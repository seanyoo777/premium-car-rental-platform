export type VehicleStatus =
  | "available"
  | "reserved"
  | "contracted"
  | "maintenance"
  | "hidden";

export type ApplicationStatus =
  | "new"
  | "contacted"
  | "reviewing"
  | "approved"
  | "contracted"
  | "cancelled";

export type ContractStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "active"
  | "overdue"
  | "completed"
  | "cancelled";

export type PaymentRecordStatus = "scheduled" | "paid" | "overdue" | "waived";

export type AutodebitStatus =
  | "not_registered"
  | "requested"
  | "active"
  | "failed"
  | "cancelled";

export type CustomerType = "individual" | "corporate";

/** 관리자 mock RBAC */
export type AdminRole =
  | "hq_admin"
  | "branch_admin"
  | "sales_manager"
  | "finance_manager"
  | "readonly";

export interface AdminAccessState {
  role: AdminRole;
  /** branch_admin / sales_manager 소속 지점 (필수). 그 외 null */
  assignedBranchId: string | null;
  /** hq_admin, finance_manager, readonly 목록 필터 (null = 전체) */
  filterBranchId: string | null;
}

/** 지점 (본사/지점 구분, 확장용) */
export interface Branch {
  id: string;
  name: string;
  code: string;
  isHeadquarters: boolean;
  /** 지역 태그 (예: 김해) */
  regionTag: string;
  /** 특별 혜택 안내 문구 */
  specialBenefitsNote: string;
}

export interface StatusChangeEntry {
  at: string;
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  by: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  detail?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  /** 모델 연식 (선택, 카탈로그 자동완성용) */
  modelYear?: number;
  /** 전체 차량 가격 (원, 정수) */
  priceWon: number;
  /** 보증금 비율 0~100 (정수 퍼센트) */
  depositPercent: number;
  /** 월 납입 예상액 (원) */
  monthlyPaymentWon: number;
  /** 계약 기간(개월) */
  contractMonths: number;
  imageUrl: string;
  status: VehicleStatus;
  /** 소속 지점 (스코프 필터) */
  branchId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  region: string;
  customerType: CustomerType;
  preferredVehicleId?: string;
  createdAt: string;
  branchId: string;
}

export interface Application {
  id: string;
  name: string;
  phone: string;
  region: string;
  customerType: CustomerType;
  preferredVehicleId?: string;
  /** 신청에서 생성된 계약 ID (중복 생성 방지) */
  linkedContractId?: string;
  message: string;
  privacyAgreed: boolean;
  status: ApplicationStatus;
  memo: string;
  statusLog: StatusChangeEntry[];
  createdAt: string;
  mockRef: string;
  branchId: string;
}

export interface Contract {
  id: string;
  /** 신청 기반 생성 시 연결 */
  applicationId?: string;
  customerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  monthlyDueDay: number;
  monthlyPaymentWon: number;
  depositWon: number;
  status: ContractStatus;
  memo: string;
  /** 자동이체 등록 mock (실제 은행/API 없음) */
  autodebitStatus: AutodebitStatus;
  branchId: string;
}

export interface PaymentRecord {
  id: string;
  contractId: string;
  branchId: string;
  dueDate: string;
  amountWon: number;
  status: PaymentRecordStatus;
  /** 입금확인 처리 시각 (mock) */
  depositConfirmedAt?: string;
  /** 미납 알림 mock 발송 시각 */
  overdueNotifiedAt?: string;
}

/** 실제 푸시 없음 — 알림 로그만 */
export interface PushNotificationLog {
  id: string;
  at: string;
  channel: "mock_push";
  title: string;
  body: string;
  targetPhone?: string;
  contractId?: string;
  paymentId?: string;
}

export interface CompanyProfile {
  vendorName: string;
  agencyName: string;
  vendorPhone: string;
  regionNote: string;
  transparencyNote: string;
  /** 본사·지점 목록 (데모) */
  branches: Branch[];
}

export interface DemoState {
  vehicles: Vehicle[];
  customers: Customer[];
  applications: Application[];
  contracts: Contract[];
  payments: PaymentRecord[];
  company: CompanyProfile;
  auditLogs: AuditLogEntry[];
  /** mock 푸시 알림 로그 (실제 발송 없음) */
  notificationLogs: PushNotificationLog[];
}
