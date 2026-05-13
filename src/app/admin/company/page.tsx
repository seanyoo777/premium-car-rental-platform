"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useDemoData } from "@/context/demo-data-context";
import { canUpdateCompany, isReadonlyRole } from "@/lib/admin-access";
import type { Branch } from "@/lib/types";

function newBranchId() {
  return `br-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AdminCompanyPage() {
  const { state, adminAccess, hydrated, updateCompany } = useDemoData();
  const mut = canUpdateCompany(adminAccess.role) && !isReadonlyRole(adminAccess.role);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const branches = state.company.branches;

  const hq = useMemo(() => branches.find((b) => b.isHeadquarters), [branches]);

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  function patchBranch(id: string, patch: Partial<Branch>) {
    updateCompany({
      branches: branches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  }

  function addBranch() {
    updateCompany({
      branches: [
        ...branches,
        {
          id: newBranchId(),
          name: "신규 지점",
          code: "BR",
          isHeadquarters: false,
          regionTag: "",
          specialBenefitsNote: "",
        },
      ],
    });
  }

  function confirmRemove() {
    if (!deleteId) return;
    const target = branches.find((b) => b.id === deleteId);
    if (target?.isHeadquarters) return;
    updateCompany({ branches: branches.filter((b) => b.id !== deleteId) });
    setDeleteId(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">업체 / 에이전시 / 지점</h1>
        <p className="text-sm text-slate-600">
          가람렌트카 · 올인카 브랜딩과 본사/지점(김해 특화 포함) 정보를 데모 저장합니다.
        </p>
      </header>
      <div
        className={`space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm ${!mut ? "pointer-events-none opacity-50" : ""}`}
      >
        <label className="block space-y-1">
          <span className="text-xs font-semibold">업체명</span>
          <input
            className="h-10 w-full rounded-xl border px-2"
            value={state.company.vendorName}
            onChange={(e) => updateCompany({ vendorName: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold">에이전시</span>
          <input
            className="h-10 w-full rounded-xl border px-2"
            value={state.company.agencyName}
            onChange={(e) => updateCompany({ agencyName: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold">대표 연락처 (데모)</span>
          <input
            className="h-10 w-full rounded-xl border px-2"
            value={state.company.vendorPhone}
            onChange={(e) => updateCompany({ vendorPhone: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold">지역 특화 문구</span>
          <input
            className="h-10 w-full rounded-xl border px-2"
            value={state.company.regionNote}
            onChange={(e) => updateCompany({ regionNote: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold">투명성 / 보증 문구</span>
          <textarea
            className="min-h-[88px] w-full rounded-xl border px-2 py-2"
            value={state.company.transparencyNote}
            onChange={(e) =>
              updateCompany({ transparencyNote: e.target.value })
            }
          />
        </label>
      </div>

      <section
        className={`space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${!mut ? "pointer-events-none opacity-50" : ""}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">지점 목록</h2>
          <button
            type="button"
            disabled={!mut}
            onClick={addBranch}
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            지점 추가
          </button>
        </div>
        {hq ? (
          <p className="text-xs text-slate-500">
            본사 지점: <span className="font-medium text-slate-800">{hq.name}</span> (
            {hq.code})
          </p>
        ) : null}
        <div className="space-y-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">
                  {b.isHeadquarters ? "본사" : "지점"}
                </span>
                {!b.isHeadquarters ? (
                  <button
                    type="button"
                    disabled={!mut}
                    onClick={() => setDeleteId(b.id)}
                    className="text-rose-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    삭제
                  </button>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">지점명</span>
                  <input
                    className="h-9 w-full rounded-lg border px-2"
                    value={b.name}
                    onChange={(e) => patchBranch(b.id, { name: e.target.value })}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">코드</span>
                  <input
                    className="h-9 w-full rounded-lg border px-2"
                    value={b.code}
                    onChange={(e) => patchBranch(b.id, { code: e.target.value })}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-slate-500">지역 태그</span>
                  <input
                    className="h-9 w-full rounded-lg border px-2"
                    value={b.regionTag}
                    onChange={(e) => patchBranch(b.id, { regionTag: e.target.value })}
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] text-slate-500">특별 혜택 문구</span>
                  <textarea
                    className="min-h-[56px] w-full rounded-lg border px-2 py-1"
                    value={b.specialBenefitsNote}
                    onChange={(e) =>
                      patchBranch(b.id, { specialBenefitsNote: e.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={!!deleteId}
        title="지점을 삭제할까요?"
        description="본사 지점은 삭제할 수 없습니다. 데모 데이터에서만 제거됩니다."
        danger
        confirmLabel="삭제"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
