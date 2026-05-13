"use client";

import type { TimelineRow } from "@/lib/application-timeline";

export function ApplicationTimeline({ rows }: { rows: TimelineRow[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600">진행 타임라인</p>
      <ol className="mt-2 space-y-2 border-l border-slate-200 pl-3">
        {rows.map((row) => (
          <li key={row.phase} className="relative text-xs">
            <span
              className={`absolute -left-[17px] top-1 h-2 w-2 rounded-full border border-white ${
                row.done ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <span className="font-medium text-slate-800">{row.title}</span>
              {row.at ? (
                <span className="text-[10px] text-slate-500">
                  {new Date(row.at).toLocaleString("ko-KR")}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">—</span>
              )}
            </div>
            {row.detail ? (
              <p className="mt-0.5 text-[11px] text-slate-500">{row.detail}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
