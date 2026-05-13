"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useDemoData } from "@/context/demo-data-context";
import { formatWon } from "@/lib/format";
import { canMutatePayments, isReadonlyRole } from "@/lib/admin-access";
import type { PaymentRecordStatus } from "@/lib/types";

const payStatuses: PaymentRecordStatus[] = [
  "scheduled",
  "paid",
  "overdue",
  "waived",
];

export default function AdminPaymentsPage() {
  const {
    adminLists,
    adminAccess,
    hydrated,
    updatePayment,
    parsePaymentStatus,
    confirmDeposit,
  } = useDemoData();
  const payMut =
    canMutatePayments(adminAccess.role) && !isReadonlyRole(adminAccess.role);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selected = useMemo(
    () => adminLists.payments.find((p) => p.id === selectedId) ?? null,
    [selectedId, adminLists.payments],
  );

  const rows = useMemo(() => {
    return adminLists.payments.map((p) => {
      const ct = adminLists.contracts.find((c) => c.id === p.contractId);
      const cust = ct
        ? adminLists.customers.find((c) => c.id === ct.customerId)
        : undefined;
      return { p, ct, cust };
    });
  }, [adminLists.payments, adminLists.contracts, adminLists.customers]);

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  const canConfirmDeposit =
    payMut &&
    selected &&
    selected.status !== "paid" &&
    selected.status !== "waived";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">납부 관리</h1>
        <p className="text-sm text-slate-600">
          입금확인은 paid로 고정하며 중복 확인을 막습니다. 실제 결제 게이트웨이는 없습니다.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">고객</th>
                  <th className="px-3 py-2">만기일</th>
                  <th className="px-3 py-2">금액</th>
                  <th className="px-3 py-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, cust }) => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer border-t border-slate-100 ${
                      selectedId === p.id ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td className="px-3 py-2">{cust?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{p.dueDate}</td>
                    <td className="px-3 py-2 text-xs">{formatWon(p.amountWon)}</td>
                    <td className="px-3 py-2 text-xs">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3 text-xs">
                <p className="font-semibold text-slate-800">입금확인</p>
                <p className="mt-1 text-slate-600">
                  {selected.status === "paid"
                    ? "이미 입금 확인된 건입니다."
                    : "확인 시 paid + mock 푸시 로그 + 감사 로그가 남습니다."}
                </p>
                <button
                  type="button"
                  disabled={!canConfirmDeposit}
                  onClick={() => setConfirmOpen(true)}
                  className="mt-2 h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  입금확인
                </button>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">납부 상태</span>
                <select
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.status}
                  disabled={!payMut}
                  onChange={(e) => {
                    const s = parsePaymentStatus(e.target.value);
                    if (!s) return;
                    updatePayment(selected.id, { status: s });
                  }}
                >
                  {payStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">만기일</span>
                <input
                  type="date"
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.dueDate}
                  disabled={!payMut}
                  onChange={(e) =>
                    updatePayment(selected.id, { dueDate: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold">금액(원)</span>
                <input
                  type="number"
                  className="h-10 w-full rounded-xl border px-2"
                  value={selected.amountWon}
                  disabled={!payMut}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updatePayment(selected.id, { amountWon: Math.round(n) });
                  }}
                />
              </label>
              {selected.depositConfirmedAt ? (
                <p className="text-[11px] text-slate-500">
                  입금확인 시각:{" "}
                  {new Date(selected.depositConfirmedAt).toLocaleString("ko-KR")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">행을 선택하세요.</p>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="입금을 확인할까요?"
        description="상태가 paid로 바뀌며 중복 입금확인은 불가합니다. (mock)"
        confirmLabel="입금확인"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (selected) confirmDeposit(selected.id);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
