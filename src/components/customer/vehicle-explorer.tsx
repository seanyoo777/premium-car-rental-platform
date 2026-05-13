"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDemoData } from "@/context/demo-data-context";
import { computeDepositWon, formatWon } from "@/lib/format";

export function VehicleExplorer() {
  const { state, hydrated } = useDemoData();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.vehicles
      .filter((v) => v.status !== "hidden")
      .filter((v) => {
        if (!term) return true;
        const blob = `${v.name} ${v.brand} ${v.model}`.toLowerCase();
        return blob.includes(term);
      });
  }, [q, state.vehicles]);

  if (!hydrated) {
    return (
      <p className="text-sm text-slate-500">차량 정보를 불러오는 중입니다…</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">차량 검색 · 가격 정보</h2>
          <p className="text-sm text-slate-600">
            차량명 기준 검색 · 월 납입·보증금·계약기간은 데모 산출값입니다.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 제네시스, BMW"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-sky-500/40 focus:ring-2 sm:max-w-xs"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((v) => {
          const deposit = computeDepositWon(v.priceWon, v.depositPercent);
          return (
            <article
              key={v.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-44 w-full bg-slate-100">
                <Image
                  src={v.imageUrl}
                  alt={v.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
                <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white">
                  {v.status === "available"
                    ? "렌트 가능"
                    : v.status === "reserved"
                      ? "예약중"
                      : v.status === "contracted"
                        ? "계약중"
                        : "점검"}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{v.name}</h3>
                  <p className="text-xs text-slate-500">
                    {v.brand} · {v.model}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                  <dt className="text-slate-500">차량 가격</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {formatWon(v.priceWon)}
                  </dd>
                  <dt className="text-slate-500">보증금</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {formatWon(deposit)}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ({v.depositPercent}%)
                    </span>
                  </dd>
                  <dt className="text-slate-500">월 납입 예상</dt>
                  <dd className="text-right font-semibold text-sky-700">
                    {formatWon(v.monthlyPaymentWon)}
                  </dd>
                  <dt className="text-slate-500">계약 기간</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {v.contractMonths}개월
                  </dd>
                </dl>
                <Link
                  href={`/apply?vehicle=${encodeURIComponent(v.id)}`}
                  className="mt-auto inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  이 차량으로 신청
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">검색 결과가 없습니다.</p>
      ) : null}
    </div>
  );
}
