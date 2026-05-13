"use client";

import { useMemo, useState } from "react";
import { useDemoData } from "@/context/demo-data-context";
import { DEFAULT_DEMO_BRANCH_ID } from "@/lib/constants";
import { canEditVehicleOrContract, isReadonlyRole } from "@/lib/admin-access";
import type { AutodebitStatus, ContractStatus } from "@/lib/types";
import { formatWon } from "@/lib/format";

const contractStatuses: ContractStatus[] = [
  "pending",
  "reviewing",
  "approved",
  "active",
  "overdue",
  "completed",
  "cancelled",
];

const autodebitOptions: AutodebitStatus[] = [
  "not_registered",
  "requested",
  "active",
  "failed",
  "cancelled",
];

export default function AdminContractsPage() {
  const {
    state,
    adminLists,
    adminAccess,
    hydrated,
    addContract,
    updateContract,
    parseContractStatus,
    parseAutodebitStatus,
  } = useDemoData();
  const mut =
    canEditVehicleOrContract(adminAccess.role) && !isReadonlyRole(adminAccess.role);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    customerId: "",
    vehicleId: "",
    startDate: "",
    endDate: "",
    monthlyDueDay: 5,
    monthlyPaymentWon: 900_000,
    depositWon: 10_000_000,
    status: "pending" as ContractStatus,
    memo: "",
    autodebitStatus: "not_registered" as AutodebitStatus,
  });

  const selected = useMemo(
    () => adminLists.contracts.find((c) => c.id === selectedId) ?? null,
    [selectedId, adminLists.contracts],
  );

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  function create() {
    if (!draft.customerId || !draft.vehicleId || !draft.startDate || !draft.endDate)
      return;
    const cust = state.customers.find((c) => c.id === draft.customerId);
    const veh = state.vehicles.find((v) => v.id === draft.vehicleId);
    addContract({
      customerId: draft.customerId,
      vehicleId: draft.vehicleId,
      startDate: draft.startDate,
      endDate: draft.endDate,
      monthlyDueDay: Math.min(28, Math.max(1, Math.round(draft.monthlyDueDay))),
      monthlyPaymentWon: Math.round(draft.monthlyPaymentWon),
      depositWon: Math.round(draft.depositWon),
      status: draft.status,
      memo: draft.memo,
      autodebitStatus: draft.autodebitStatus,
      branchId: cust?.branchId ?? veh?.branchId ?? DEFAULT_DEMO_BRANCH_ID,
    });
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">계약 관리</h1>
        <p className="text-sm text-slate-600">
          계약 상태 머신은 문서 `docs/CONTRACT_SYSTEM.md`와 동일한 키를 사용합니다.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">계약 추가 (데모)</h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <select
            className="h-10 rounded-xl border px-2"
            value={draft.customerId}
            disabled={!mut}
            onChange={(e) => setDraft((d) => ({ ...d, customerId: e.target.value }))}
          >
            <option value="">고객 선택</option>
            {adminLists.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-xl border px-2"
            value={draft.vehicleId}
            disabled={!mut}
            onChange={(e) => setDraft((d) => ({ ...d, vehicleId: e.target.value }))}
          >
            <option value="">차량 선택</option>
            {adminLists.vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="h-10 rounded-xl border px-2"
            value={draft.startDate}
            disabled={!mut}
            onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
          />
          <input
            type="date"
            className="h-10 rounded-xl border px-2"
            value={draft.endDate}
            disabled={!mut}
            onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
          />
          <input
            type="number"
            placeholder="월 납부일"
            className="h-10 rounded-xl border px-2"
            value={draft.monthlyDueDay}
            disabled={!mut}
            onChange={(e) =>
              setDraft((d) => ({ ...d, monthlyDueDay: Number(e.target.value) }))
            }
          />
          <input
            type="number"
            placeholder="월 납입금"
            className="h-10 rounded-xl border px-2"
            value={draft.monthlyPaymentWon}
            disabled={!mut}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                monthlyPaymentWon: Number(e.target.value),
              }))
            }
          />
          <input
            type="number"
            placeholder="보증금"
            className="h-10 rounded-xl border px-2"
            value={draft.depositWon}
            disabled={!mut}
            onChange={(e) =>
              setDraft((d) => ({ ...d, depositWon: Number(e.target.value) }))
            }
          />
          <select
            className="h-10 rounded-xl border px-2"
            value={draft.status}
            disabled={!mut}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                status: e.target.value as ContractStatus,
              }))
            }
          >
            {contractStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-xl border px-2"
            value={draft.autodebitStatus}
            disabled={!mut}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                autodebitStatus: e.target.value as AutodebitStatus,
              }))
            }
          >
            {autodebitOptions.map((s) => (
              <option key={s} value={s}>
                자동이체: {s}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-xl border px-2 sm:col-span-2"
            placeholder="메모"
            value={draft.memo}
            disabled={!mut}
            onChange={(e) => setDraft((d) => ({ ...d, memo: e.target.value }))}
          />
          <button
            type="button"
            onClick={create}
            disabled={!mut}
            className="h-10 rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            계약 생성
          </button>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">고객</th>
                  <th className="px-3 py-2">차량</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">월 납입</th>
                </tr>
              </thead>
              <tbody>
                {adminLists.contracts.map((ct) => {
                  const cust = state.customers.find((c) => c.id === ct.customerId);
                  const veh = state.vehicles.find((v) => v.id === ct.vehicleId);
                  return (
                    <tr
                      key={ct.id}
                      className={`cursor-pointer border-t border-slate-100 ${
                        selectedId === ct.id ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedId(ct.id)}
                    >
                      <td className="px-3 py-2">{cust?.name ?? ct.customerId}</td>
                      <td className="px-3 py-2 text-xs">{veh?.name ?? ct.vehicleId}</td>
                      <td className="px-3 py-2 text-xs">{ct.status}</td>
                      <td className="px-3 py-2 text-xs">
                        {formatWon(ct.monthlyPaymentWon)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          {selected ? (
            <div className="space-y-3 text-sm">
              <label className="block space-y-1">
                <span className="text-xs font-semibold">계약 상태</span>
                <select
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.status}
                  disabled={!mut}
                  onChange={(e) => {
                    const s = parseContractStatus(e.target.value);
                    if (!s) return;
                    updateContract(selected.id, { status: s });
                  }}
                >
                  {contractStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">시작일</span>
                <input
                  type="date"
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.startDate}
                  disabled={!mut}
                  onChange={(e) =>
                    updateContract(selected.id, { startDate: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">종료일</span>
                <input
                  type="date"
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.endDate}
                  disabled={!mut}
                  onChange={(e) =>
                    updateContract(selected.id, { endDate: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">월 납부일</span>
                <input
                  type="number"
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.monthlyDueDay}
                  disabled={!mut}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updateContract(selected.id, {
                      monthlyDueDay: Math.min(28, Math.max(1, Math.round(n))),
                    });
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">월 납입금(원)</span>
                <input
                  type="number"
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.monthlyPaymentWon}
                  disabled={!mut}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updateContract(selected.id, {
                      monthlyPaymentWon: Math.round(n),
                    });
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">보증금(원)</span>
                <input
                  type="number"
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.depositWon}
                  disabled={!mut}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updateContract(selected.id, { depositWon: Math.round(n) });
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">메모</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border px-2 py-2"
                  value={selected.memo}
                  disabled={!mut}
                  onChange={(e) =>
                    updateContract(selected.id, { memo: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">자동이체(mock)</span>
                <select
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.autodebitStatus}
                  disabled={!mut}
                  onChange={(e) => {
                    const s = parseAutodebitStatus(e.target.value);
                    if (!s) return;
                    updateContract(selected.id, { autodebitStatus: s });
                  }}
                >
                  {autodebitOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <p className="text-sm text-slate-500">계약을 선택하세요.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
