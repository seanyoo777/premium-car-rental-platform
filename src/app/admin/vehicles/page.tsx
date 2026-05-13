"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useDemoData } from "@/context/demo-data-context";
import {
  canDeleteVehicle,
  canEditVehicleOrContract,
  isReadonlyRole,
} from "@/lib/admin-access";
import type { VehicleStatus } from "@/lib/types";

const statuses: VehicleStatus[] = [
  "available",
  "reserved",
  "contracted",
  "maintenance",
  "hidden",
];

export default function AdminVehiclesManagePage() {
  const router = useRouter();
  const {
    adminLists,
    adminAccess,
    hydrated,
    updateVehicle,
    deleteVehicle,
    parseVehicleStatus,
  } = useDemoData();
  const mut =
    canEditVehicleOrContract(adminAccess.role) && !isReadonlyRole(adminAccess.role);
  const canDel =
    canDeleteVehicle(adminAccess.role) && !isReadonlyRole(adminAccess.role);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = useMemo(
    () => adminLists.vehicles.find((v) => v.id === selectedId) ?? null,
    [selectedId, adminLists.vehicles],
  );

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">차량 관리</h1>
          <p className="text-sm text-slate-600">
            재고·상태를 조정합니다. 삭제는 위험 작업으로 확인 모달을 사용합니다.
          </p>
        </div>
        <button
          type="button"
          disabled={!mut}
          onClick={() => router.push("/admin/vehicles/new")}
          className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          새 차량 등록
        </button>
      </header>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">차량명</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">월 납입</th>
                </tr>
              </thead>
              <tbody>
                {adminLists.vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className={`cursor-pointer border-t border-slate-100 ${
                      selectedId === v.id ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedId(v.id)}
                  >
                    <td className="px-3 py-2 font-medium">{v.name}</td>
                    <td className="px-3 py-2 text-xs">{v.status}</td>
                    <td className="px-3 py-2 text-xs">{v.monthlyPaymentWon.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          {selected ? (
            <div
              className={`space-y-3 text-sm ${!mut ? "pointer-events-none opacity-50" : ""}`}
            >
              <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={selected.imageUrl}
                  alt={selected.name}
                  fill
                  className="object-cover"
                />
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">차량명</span>
                <input
                  className="h-9 w-full rounded-lg border px-2"
                  value={selected.name}
                  onChange={(e) =>
                    updateVehicle(selected.id, { name: e.target.value })
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold">브랜드</span>
                  <input
                    className="h-9 w-full rounded-lg border px-2"
                    value={selected.brand}
                    onChange={(e) =>
                      updateVehicle(selected.id, { brand: e.target.value })
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold">모델</span>
                  <input
                    className="h-9 w-full rounded-lg border px-2"
                    value={selected.model}
                    onChange={(e) =>
                      updateVehicle(selected.id, { model: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">차량가격(원, 정수)</span>
                <input
                  type="number"
                  className="h-9 w-full rounded-lg border px-2"
                  value={selected.priceWon}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updateVehicle(selected.id, { priceWon: Math.round(n) });
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">보증금 비율(%)</span>
                <input
                  type="number"
                  className="h-9 w-full rounded-lg border px-2"
                  value={selected.depositPercent}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updateVehicle(selected.id, {
                      depositPercent: Math.min(100, Math.max(0, Math.round(n))),
                    });
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">월 납입 예상액(원)</span>
                <input
                  type="number"
                  className="h-9 w-full rounded-lg border px-2"
                  value={selected.monthlyPaymentWon}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updateVehicle(selected.id, {
                      monthlyPaymentWon: Math.round(n),
                    });
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">계약기간(개월)</span>
                <input
                  type="number"
                  className="h-9 w-full rounded-lg border px-2"
                  value={selected.contractMonths}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updateVehicle(selected.id, {
                      contractMonths: Math.max(1, Math.round(n)),
                    });
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">이미지 URL</span>
                <input
                  className="h-9 w-full rounded-lg border px-2"
                  value={selected.imageUrl}
                  onChange={(e) =>
                    updateVehicle(selected.id, { imageUrl: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">차량 상태</span>
                <select
                  className="h-9 w-full rounded-lg border px-2"
                  value={selected.status}
                  onChange={(e) => {
                    const s = parseVehicleStatus(e.target.value);
                    if (!s) return;
                    updateVehicle(selected.id, { status: s });
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!canDel}
                onClick={() => setConfirmDelete(true)}
                className="h-10 w-full rounded-xl border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                차량 삭제
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">차량을 선택하세요.</p>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmDelete && !!selected}
        title="차량을 삭제할까요?"
        description="연결된 계약이 있어도 데모에서는 강제 삭제됩니다. 실서비스에서는 참조 무결성 검사가 필요합니다."
        danger
        confirmLabel="삭제"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (selected) deleteVehicle(selected.id);
          setConfirmDelete(false);
          setSelectedId(null);
        }}
      />
    </div>
  );
}
