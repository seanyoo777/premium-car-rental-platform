"use client";

import { useMemo, useState } from "react";
import { ApplicationTimeline } from "@/components/admin/application-timeline";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useDemoData } from "@/context/demo-data-context";
import { buildApplicationTimeline } from "@/lib/application-timeline";
import {
  canCreateContractFromApplication,
  canEditApplications,
  isReadonlyRole,
} from "@/lib/admin-access";
import type { ApplicationStatus } from "@/lib/types";

const statuses: ApplicationStatus[] = [
  "new",
  "contacted",
  "reviewing",
  "approved",
  "contracted",
  "cancelled",
];

export default function AdminApplicationsPage() {
  const {
    state,
    adminLists,
    adminAccess,
    hydrated,
    updateApplication,
    parseApplicationStatus,
    createContractFromApplication,
    addCustomer,
  } = useDemoData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [confirmContract, setConfirmContract] = useState(false);
  const [contractMsg, setContractMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => adminLists.applications.find((a) => a.id === selectedId) ?? null,
    [selectedId, adminLists.applications],
  );

  const branchCustomers = useMemo(() => {
    if (!selected) return adminLists.customers;
    return adminLists.customers.filter((c) => c.branchId === selected.branchId);
  }, [adminLists.customers, selected]);

  const linkedContract = useMemo(() => {
    if (!selected) return null;
    if (selected.linkedContractId) {
      return (
        state.contracts.find((c) => c.id === selected.linkedContractId) ?? null
      );
    }
    return state.contracts.find((c) => c.applicationId === selected.id) ?? null;
  }, [selected, state.contracts]);

  const timelineRows = useMemo(() => {
    if (!selected) return [];
    return buildApplicationTimeline(selected, linkedContract, state.payments);
  }, [selected, linkedContract, state.payments]);

  const vehicleForContract = useMemo(() => {
    if (!selected?.preferredVehicleId) return null;
    return state.vehicles.find((v) => v.id === selected.preferredVehicleId) ?? null;
  }, [selected, state.vehicles]);

  const canCreateContract = useMemo(() => {
    if (!canCreateContractFromApplication(adminAccess.role)) return false;
    if (isReadonlyRole(adminAccess.role)) return false;
    if (!selected) return false;
    if (selected.linkedContractId) return false;
    if (selected.status !== "reviewing" && selected.status !== "approved")
      return false;
    if (!selected.preferredVehicleId) return false;
    const v = state.vehicles.find((x) => x.id === selected.preferredVehicleId);
    if (!v) return false;
    if (v.status === "hidden") return false;
    return true;
  }, [selected, state.vehicles, adminAccess.role]);

  const blockReason = useMemo(() => {
    if (!selected) return "신청을 선택하세요.";
    if (selected.linkedContractId) return "이미 계약이 연결된 신청입니다.";
    if (selected.status !== "reviewing" && selected.status !== "approved") {
      return "심사(reviewing) 또는 승인(approved) 상태여야 합니다.";
    }
    if (!selected.preferredVehicleId) return "희망 차량이 필요합니다.";
    const v = state.vehicles.find((x) => x.id === selected.preferredVehicleId);
    if (!v) return "희망 차량이 존재하지 않습니다.";
    if (v.status === "hidden") return "비공개 차량으로는 계약을 만들 수 없습니다.";
    return null;
  }, [selected, state.vehicles]);

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  function registerApplicantAsCustomer() {
    if (!selected) return;
    const id = addCustomer({
      name: selected.name,
      phone: selected.phone,
      region: selected.region,
      customerType: selected.customerType,
      preferredVehicleId: selected.preferredVehicleId,
      branchId: selected.branchId,
    });
    setCustomerId(id);
  }

  function openContractModal() {
    setContractMsg(null);
    if (!canCreateContract) {
      setContractMsg(blockReason ?? "계약을 생성할 수 없습니다.");
      return;
    }
    if (!customerId) {
      setContractMsg("고객을 선택하거나 신청자로 등록하세요.");
      return;
    }
    setConfirmContract(true);
  }

  function confirmCreateContract() {
    if (!selected || !customerId) return;
    const res = createContractFromApplication(selected.id, customerId);
    if (!res.ok) {
      setContractMsg(res.error);
      setConfirmContract(false);
      return;
    }
    setConfirmContract(false);
    setCustomerId("");
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">고객 신청 관리</h1>
        <p className="text-sm text-slate-600">
          심사·승인 후 계약 생성 시 차량 재고는 중앙 규칙으로 동기화됩니다. (mock)
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">접수번호</th>
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">연락처</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">계약</th>
                </tr>
              </thead>
              <tbody>
                {adminLists.applications.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`cursor-pointer border-t border-slate-100 ${
                      selectedId === a.id ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{a.mockRef}</td>
                    <td className="px-3 py-2 font-medium">{a.name}</td>
                    <td className="px-3 py-2">{a.phone}</td>
                    <td className="px-3 py-2 text-xs">{a.status}</td>
                    <td className="px-3 py-2 text-xs">
                      {a.linkedContractId ? "연결됨" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          {selected ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500">접수번호</p>
                <p className="font-mono text-base font-bold">{selected.mockRef}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500">이름</p>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">연락처</p>
                  <p>{selected.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">지역</p>
                  <p>{selected.region}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">구분</p>
                  <p>{selected.customerType === "corporate" ? "법인" : "개인"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">희망 차량</p>
                  <p>
                    {vehicleForContract
                      ? vehicleForContract.name
                      : selected.preferredVehicleId || "—"}
                  </p>
                </div>
              </div>

              <ApplicationTimeline rows={timelineRows} />

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold text-slate-700">계약 생성</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {canCreateContract
                    ? "심사·승인 후 고객을 연결하고 생성하세요."
                    : blockReason}
                </p>
                <label className="mt-2 block space-y-1">
                  <span className="text-xs font-semibold">연결 고객</span>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs"
                    value={customerId}
                    disabled={
                      !canEditApplications(adminAccess.role) ||
                      isReadonlyRole(adminAccess.role)
                    }
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">선택</option>
                    {branchCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.phone}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={registerApplicantAsCustomer}
                  disabled={
                    !canEditApplications(adminAccess.role) ||
                    isReadonlyRole(adminAccess.role)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  신청자 정보로 고객 등록
                </button>
                <button
                  type="button"
                  disabled={!canCreateContract}
                  onClick={openContractModal}
                  className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  계약 생성…
                </button>
                {linkedContract ? (
                  <p className="mt-2 text-[11px] text-slate-600">
                    연결 계약:{" "}
                    <span className="font-mono font-medium">{linkedContract.id}</span>{" "}
                    ({linkedContract.status})
                  </p>
                ) : null}
                {contractMsg ? (
                  <p className="mt-2 text-xs text-rose-600">{contractMsg}</p>
                ) : null}
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">상태</span>
                <select
                  className="h-10 w-full rounded-xl border border-slate-200 px-2"
                  value={selected.status}
                  disabled={
                    !canEditApplications(adminAccess.role) ||
                    isReadonlyRole(adminAccess.role)
                  }
                  onChange={(e) => {
                    const next = parseApplicationStatus(e.target.value);
                    if (!next) return;
                    updateApplication(selected.id, { status: next });
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">상담 메모</span>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border border-slate-200 px-2 py-2"
                  value={selected.memo}
                  disabled={
                    !canEditApplications(adminAccess.role) ||
                    isReadonlyRole(adminAccess.role)
                  }
                  onChange={(e) =>
                    updateApplication(selected.id, { memo: e.target.value })
                  }
                />
              </label>
              <div>
                <p className="text-xs font-semibold text-slate-600">상태 변경 로그</p>
                <ul className="mt-1 max-h-32 space-y-1 overflow-auto text-[11px] text-slate-600">
                  {[...selected.statusLog].reverse().map((l, idx) => (
                    <li key={`${l.at}-${idx}`}>
                      {new Date(l.at).toLocaleString("ko-KR")} · {l.from ?? "—"} →{" "}
                      {l.to} ({l.by})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">행을 선택하면 상세가 표시됩니다.</p>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmContract}
        title="신청에서 계약을 생성할까요?"
        description={
          selected && vehicleForContract
            ? `고객 ID ${customerId} · 차량 ${vehicleForContract.name} · 월 납입 ${vehicleForContract.monthlyPaymentWon.toLocaleString()}원 기준으로 mock 계약이 만들어지고, 신청 상태는 contracted로 바뀝니다.`
            : "조건을 확인할 수 없습니다."
        }
        confirmLabel="생성"
        onCancel={() => setConfirmContract(false)}
        onConfirm={confirmCreateContract}
      />
    </div>
  );
}
