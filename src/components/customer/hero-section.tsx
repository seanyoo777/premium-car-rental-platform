"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-5 py-10 text-white shadow-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="relative space-y-4">
        <p className="text-sm font-medium text-sky-100/90">
          김해 고객 특별 혜택 · 투명한 안내
        </p>
        <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
          3년 타면 인수 가능한
          <br />
          프리미엄 렌트
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
          숨겨진 비용 없는 구조로 월 납입·보증금·계약 기간을 명확히 안내합니다.
          법인 차량도 안정적인 렌트 흐름을 목표로 설계된 데모 화면입니다.
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <Link
            href="/apply"
            className="inline-flex h-14 min-w-[200px] items-center justify-center rounded-2xl bg-white px-6 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-slate-50"
          >
            신청하기
          </Link>
          <Link
            href="/vehicles"
            className="inline-flex h-14 min-w-[200px] items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
          >
            차량 검색
          </Link>
        </div>
      </div>
    </section>
  );
}
