"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useDemoData } from "@/context/demo-data-context";
import { todayIso } from "@/lib/customer-lookup";
import { formatWon } from "@/lib/format";
import { canRunMockAutomations, isReadonlyRole } from "@/lib/admin-access";

export default function AdminDashboardPage() {
  const { state, adminLists, adminAccess, hydrated, runMockAutomations } =
    useDemoData();
  const ran = useRef(false);

  useEffect(() => {
    if (!hydrated || ran.current) return;
    ran.current = true;
    runMockAutomations();
  }, [hydrated, runMockAutomations]);

  const today = todayIso();

  const metrics = useMemo(() => {
    const todayDue = adminLists.payments.filter(
      (p) => p.dueDate === today && p.status === "scheduled",
    );
    const overduePay = adminLists.payments.filter((p) => p.status === "overdue");
    const overdueCustomerIds = new Set(
      overduePay
        .map((p) => adminLists.contracts.find((c) => c.id === p.contractId)?.customerId)
        .filter(Boolean) as string[],
    );
    const activeContracts = adminLists.contracts.filter(
      (c) => c.status === "active" || c.status === "overdue",
    );
    const consultQueue = adminLists.applications.filter(
      (a) => a.status === "new" || a.status === "contacted",
    );
    const autodebitCount = adminLists.contracts.filter(
      (c) => c.autodebitStatus === "active" || c.autodebitStatus === "requested",
    ).length;
    return {
      todayDue,
      overdueCustomers: overdueCustomerIds.size,
      overduePayments: overduePay.length,
      activeContracts: activeContracts.length,
      vehicles: adminLists.vehicles.length,
      consultQueue: consultQueue.length,
      autodebitCount,
    };
  }, [adminLists, today]);

  const risks = useMemo(() => {
    const items: { label: string; href: string; tone: "rose" | "amber" }[] = [];
    if (metrics.overduePayments > 0) {
      items.push({
        label: `미납 납부 ${metrics.overduePayments}건 · 고객 ${metrics.overdueCustomers}명`,
        href: "/admin/payments",
        tone: "rose",
      });
    }
    if (metrics.todayDue.length > 0) {
      items.push({
        label: `오늘 입금 예정 ${metrics.todayDue.length}건`,
        href: "/admin/payments",
        tone: "amber",
      });
    }
    if (metrics.consultQueue > 0) {
      items.push({
        label: `상담 대기 ${metrics.consultQueue}건`,
        href: "/admin/applications",
        tone: "amber",
      });
    }
    return items;
  }, [metrics]);

  const visibleNotificationLogs = useMemo(() => {
    const ids = new Set(adminLists.contracts.map((c) => c.id));
    return state.notificationLogs.filter(
      (n) => !n.contractId || ids.has(n.contractId),
    );
  }, [state.notificationLogs, adminLists.contracts]);

  if (!hydrated) {
    return <p className="text-sm text-slate-600">대시보드를 불러오는 중…</p>;
  }

  const cards = [
    {
      label: "오늘 입금 예정",
      value: metrics.todayDue.length,
      sub: metrics.todayDue
        .map((p) => formatWon(p.amountWon))
        .slice(0, 2)
        .join(" · "),
    },
    { label: "미납 고객", value: metrics.overdueCustomers, sub: "납부 overdue 기준" },
    { label: "계약 진행중", value: metrics.activeContracts, sub: "active+overdue" },
    { label: "차량 등록", value: metrics.vehicles, sub: "마스터 기준" },
    { label: "상담 대기", value: metrics.consultQueue, sub: "new+contacted" },
    { label: "자동이체 등록", value: metrics.autodebitCount, sub: "requested+active" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">본사 대시보드</h1>
          <p className="text-sm text-slate-600">
            입장 시 mock 자동화(미납 전환·알림 로그)를 1회 실행합니다. 실제 푸시·이체는 없습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => runMockAutomations()}
          disabled={
            !canRunMockAutomations(adminAccess.role) ||
            isReadonlyRole(adminAccess.role)
          }
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          미납 동기화 다시 실행
        </button>
      </header>

      {risks.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <h2 className="text-sm font-bold text-amber-900">확인 필요</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {risks.map((r) => (
              <li key={r.label}>
                <Link
                  href={r.href}
                  className={
                    r.tone === "rose"
                      ? "font-medium text-rose-800 underline"
                      : "font-medium text-amber-900 underline"
                  }
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{c.value}</p>
            {c.sub ? (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{c.sub}</p>
            ) : null}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">mock 푸시 알림 로그</h2>
        <p className="text-xs text-slate-500">실제 발송 없음 · 최근 6건</p>
        <ul className="mt-3 max-h-52 space-y-2 overflow-auto text-xs">
          {visibleNotificationLogs.slice(0, 6).map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2"
            >
              <p className="font-medium text-slate-800">{n.title}</p>
              <p className="text-slate-600">{n.body}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {new Date(n.at).toLocaleString("ko-KR")}
                {n.targetPhone ? ` · ${n.targetPhone}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">빠른 이동</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-full bg-slate-900 px-3 py-1.5 text-white"
            href="/admin/vehicles/new"
          >
            차량 등록
          </Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1.5" href="/admin/applications">
            신청 관리
          </Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1.5" href="/admin/contracts">
            계약 관리
          </Link>
          <Link className="rounded-full bg-slate-100 px-3 py-1.5" href="/admin/payments">
            납부 관리
          </Link>
        </div>
      </div>
    </div>
  );
}
