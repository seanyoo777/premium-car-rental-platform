"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CustomerFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-sm text-slate-600">
        <p className="font-medium text-slate-900">가람렌트카 · 에이전시 올인카</p>
        <p>
          본 화면은 데모/mock입니다. 실제 결제·금융 실행은 연결되어 있지 않습니다.
        </p>
        <div className="flex flex-wrap gap-3 pt-2 text-xs text-slate-500">
          <Link href="/admin" className="underline-offset-4 hover:underline">
            관리자 (데모)
          </Link>
        </div>
      </div>
    </footer>
  );
}
