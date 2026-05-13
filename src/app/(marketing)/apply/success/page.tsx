"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessBody() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "—";
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm">
      <p className="text-sm font-semibold text-emerald-900">신청이 접수되었습니다</p>
      <p className="text-xs text-emerald-800">
        데모 접수번호 (실제 CRM 연동 없음)
      </p>
      <p className="font-mono text-2xl font-bold tracking-tight text-emerald-950">
        {ref}
      </p>
      <p className="text-sm text-emerald-900/90">
        담당자가 순차적으로 연락드릴 예정입니다. 입력 정보는 브라우저 mock 저장소에만
        남을 수 있습니다.
      </p>
      <div className="flex flex-col gap-2 pt-2">
        <Link
          href={ref !== "—" ? `/lookup?ref=${encodeURIComponent(ref)}` : "/lookup"}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white"
        >
          접수번호로 조회하기
        </Link>
        <Link
          href="/vehicles"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-700 text-sm font-semibold text-white"
        >
          차량 목록으로
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-emerald-300 text-sm font-semibold text-emerald-900"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}

export default function ApplySuccessPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10">
      <Suspense fallback={<p className="text-sm text-slate-500">로딩 중…</p>}>
        <SuccessBody />
      </Suspense>
    </div>
  );
}
