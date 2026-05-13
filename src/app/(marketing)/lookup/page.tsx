"use client";

import { useMemo, useState, Suspense } from "react";
import { ApplicationTimeline } from "@/components/admin/application-timeline";
import { useDemoData } from "@/context/demo-data-context";
import { buildApplicationTimeline } from "@/lib/application-timeline";
import { findApplicationByRefAndPhone, todayIso } from "@/lib/customer-lookup";
import { formatWon } from "@/lib/format";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CustomerLookupBody() {
  const {
    state,
    hydrated,
    customerRequestAutodebit,
  } = useDemoData();
  const searchParams = useSearchParams();
  const [ref, setRef] = useState(() => searchParams.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);

  const app = useMemo(() => {
    if (!searched) return null;
    return findApplicationByRefAndPhone(state.applications, ref, phone);
  }, [searched, ref, phone, state.applications]);

  const linkedContract = useMemo(() => {
    if (!app) return null;
    if (app.linkedContractId) {
      return (
        state.contracts.find((c) => c.id === app.linkedContractId) ?? null
      );
    }
    return state.contracts.find((c) => c.applicationId === app.id) ?? null;
  }, [app, state.contracts]);

  const vehicle = useMemo(() => {
    if (!linkedContract) return null;
    return state.vehicles.find((v) => v.id === linkedContract.vehicleId) ?? null;
  }, [linkedContract, state.vehicles]);

  const contractPayments = useMemo(() => {
    if (!linkedContract) return [];
    return state.payments
      .filter((p) => p.contractId === linkedContract.id)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [linkedContract, state.payments]);

  const nextDue = useMemo(() => {
    const t = todayIso();
    return contractPayments.find(
      (p) =>
        (p.status === "scheduled" || p.status === "overdue") && p.dueDate >= t,
    ) ?? contractPayments.find((p) => p.status === "scheduled" || p.status === "overdue");
  }, [contractPayments]);

  const timelineRows = useMemo(() => {
    if (!app) return [];
    return buildApplicationTimeline(app, linkedContract, state.payments);
  }, [app, linkedContract, state.payments]);

  if (!hydrated) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 pb-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          단계 안내
        </p>
        <h1 className="text-2xl font-bold text-slate-900">내 신청·계약 조회</h1>
        <p className="text-sm text-slate-600">
          접수번호와 신청 시 입력한 연락처로 mock 조회합니다. 실제 본인인증은 없습니다.
        </p>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
          <strong>보안 한계:</strong> 누구나 접수번호·연락처를 알면 조회가 가능한 구조입니다. 실제 서비스에서는 본인인증·토큰 링크가
          필요합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ol className="mb-4 space-y-2 text-xs text-slate-600">
          <li>1. 접수번호 확인 (신청 완료 화면 또는 문자 안내)</li>
          <li>2. 연락처 입력 후 조회</li>
          <li>3. 계약·납부·자동이체 상태 확인</li>
        </ol>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">접수번호</span>
          <input
            className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-base"
            placeholder="GR-2026-00001"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
        </label>
        <label className="mt-3 block space-y-1 text-sm">
          <span className="font-medium text-slate-800">연락처</span>
          <input
            className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-base"
            placeholder="010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => setSearched(true)}
          className="mt-4 h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white"
        >
          조회하기
        </button>
      </section>

      {searched && !app ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          일치하는 신청이 없습니다. 접수번호·연락처를 다시 확인해 주세요.
        </p>
      ) : null}

      {app ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs text-slate-500">접수번호</p>
            <p className="font-mono text-lg font-bold text-slate-900">{app.mockRef}</p>
            <p className="mt-1 text-sm text-slate-600">진행 상태: {app.status}</p>
          </div>
          <ApplicationTimeline rows={timelineRows} />
          {linkedContract ? (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-900">계약</p>
              <p className="text-xs text-slate-600">
                계약 ID {linkedContract.id} · {linkedContract.status}
              </p>
              <p className="text-xs">
                자동이체(mock):{" "}
                <span className="font-medium">{linkedContract.autodebitStatus}</span>
              </p>
              {vehicle ? (
                <p className="text-xs text-slate-700">
                  차량: {vehicle.name} ({vehicle.brand} {vehicle.model})
                </p>
              ) : null}
              {linkedContract.autodebitStatus === "active" && nextDue ? (
                <p className="text-xs font-medium text-sky-800">
                  다음 납부 예정일: {nextDue.dueDate} · {formatWon(nextDue.amountWon)} (
                  {nextDue.status})
                </p>
              ) : null}
              {linkedContract.autodebitStatus === "not_registered" ? (
                <button
                  type="button"
                  onClick={() =>
                    customerRequestAutodebit(linkedContract.id, phone)
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-sky-300 bg-white text-sm font-semibold text-sky-800"
                >
                  자동이체 신청(mock)
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              아직 계약이 연결되지 않았습니다. 담당자 연락을 기다려 주세요.
            </p>
          )}
          {contractPayments.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-slate-700">납부 일정</p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
                {contractPayments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span>{p.dueDate}</span>
                    <span>{formatWon(p.amountWon)}</span>
                    <span className="text-slate-500">{p.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {linkedContract ? (
            <div className="space-y-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/90 p-3">
              <p className="text-xs font-semibold text-slate-800">계약 서류 (더미)</p>
              <p className="text-[11px] text-slate-600">
                PDF/서명은 UI만 제공하며 실제 파일·전자서명 API는 연결하지 않습니다.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled
                  className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500"
                >
                  계약서 PDF 보기 (read-only mock)
                </button>
                <button
                  type="button"
                  disabled
                  className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500"
                >
                  전자서명 열기 (read-only mock)
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Link
          href="/apply"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-600 text-sm font-semibold text-white"
        >
          새 상담 신청
        </Link>
        <Link href="/" className="text-center text-sm text-slate-600 underline">
          홈으로
        </Link>
      </div>
    </div>
  );
}

export default function CustomerLookupPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">불러오는 중…</p>}>
      <CustomerLookupBody />
    </Suspense>
  );
}
