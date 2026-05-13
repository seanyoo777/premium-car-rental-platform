"use client";

import { useMemo, useState } from "react";
import { useDemoData } from "@/context/demo-data-context";
import { canEditApplications, isReadonlyRole } from "@/lib/admin-access";

export default function AdminConsultationsPage() {
  const { adminLists, adminAccess, hydrated, updateApplication } =
    useDemoData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => adminLists.applications.find((a) => a.id === selectedId) ?? null,
    [selectedId, adminLists.applications],
  );

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">상담 관리</h1>
        <p className="text-sm text-slate-600">
          상담 메모 중심으로 빠르게 입력합니다. 데이터는 신청 관리와 동일합니다.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {adminLists.applications.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm shadow-sm ${
                selectedId === a.id
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{a.name}</p>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                  {a.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-slate-600">
                {a.memo || "메모 없음 · 클릭하여 작성"}
              </p>
            </button>
          ))}
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {selected ? (
            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold text-slate-500">접수번호</p>
              <p className="font-mono text-lg font-bold">{selected.mockRef}</p>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">상담 메모</span>
                <textarea
                  className="min-h-[160px] w-full rounded-xl border border-slate-200 px-3 py-2"
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
              <p className="text-xs text-slate-500">
                고객 메시지: {selected.message}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">카드를 선택하세요.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
