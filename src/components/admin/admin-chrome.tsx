"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useDemoData } from "@/context/demo-data-context";
import {
  adminRolePreset,
  canResetDemo,
  isReadonlyRole,
} from "@/lib/admin-access";

const nav = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/applications", label: "신청 관리" },
  { href: "/admin/consultations", label: "상담 관리" },
  { href: "/admin/customers", label: "회원 관리" },
  { href: "/admin/vehicles/new", label: "차량 등록" },
  { href: "/admin/vehicles", label: "차량 관리" },
  { href: "/admin/contracts", label: "계약 관리" },
  { href: "/admin/payments", label: "납부 관리" },
  { href: "/admin/company", label: "업체 정보" },
];

function navActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/vehicles") return pathname === "/admin/vehicles";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resetDemo, state, adminAccess, setAdminAccess, parseAdminRole } =
    useDemoData();
  const [confirmReset, setConfirmReset] = useState(false);

  const branchLabel = useMemo(() => {
    const b = state.company.branches.find(
      (x) => x.id === adminAccess.assignedBranchId,
    );
    if (b) return b.name;
    if (adminAccess.filterBranchId) {
      return (
        state.company.branches.find((x) => x.id === adminAccess.filterBranchId)
          ?.name ?? adminAccess.filterBranchId
      );
    }
    return "전체 지점";
  }, [adminAccess, state.company.branches]);

  const showBranchFilter =
    adminAccess.role === "hq_admin" ||
    adminAccess.role === "finance_manager" ||
    adminAccess.role === "readonly";

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-3 py-4 lg:flex-row lg:px-6">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="space-y-2 border-b border-slate-100 px-2 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin
            </p>
            <p className="text-sm font-bold text-slate-900">가람렌트카 데모</p>
            <label className="block text-[11px] font-medium text-slate-600">
              역할 (mock RBAC)
              <select
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-2 text-xs"
                value={adminAccess.role}
                onChange={(e) => {
                  const r = parseAdminRole(e.target.value);
                  if (!r) return;
                  setAdminAccess(adminRolePreset(r));
                }}
              >
                <option value="hq_admin">본사 (hq_admin)</option>
                <option value="branch_admin">지점 관리 (branch_admin)</option>
                <option value="sales_manager">영업 (sales_manager)</option>
                <option value="finance_manager">재무 (finance_manager)</option>
                <option value="readonly">읽기 전용 (readonly)</option>
              </select>
            </label>
            {showBranchFilter ? (
              <label className="block text-[11px] font-medium text-slate-600">
                지점 필터
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-2 text-xs"
                  value={adminAccess.filterBranchId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAdminAccess({
                      filterBranchId: v === "" ? null : v,
                    });
                  }}
                >
                  <option value="">전체</option>
                  {state.company.branches.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-[11px] text-slate-600">
                소속 지점: <span className="font-semibold">{branchLabel}</span>
              </p>
            )}
            {isReadonlyRole(adminAccess.role) ? (
              <p className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] text-amber-900">
                읽기 전용 — 수정·입금확인 불가
              </p>
            ) : null}
          </div>
          <nav className="mt-2 flex flex-col gap-1">
            {nav.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <Link
              href="/"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              고객 화면으로
            </Link>
            <button
              type="button"
              disabled={!canResetDemo(adminAccess.role)}
              onClick={() => setConfirmReset(true)}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              데모 데이터 초기화
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 space-y-4">{children}</main>
      <ConfirmDialog
        open={confirmReset}
        title="데모 데이터를 초기화할까요?"
        description="브라우저에 저장된 mock 데이터가 초기 시드 값으로 되돌아갑니다. 위험 작업이므로 신중히 사용하세요."
        danger
        confirmLabel="초기화"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
