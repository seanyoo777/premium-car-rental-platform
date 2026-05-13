"use client";

import { useDemoData } from "@/context/demo-data-context";

export function BusinessHighlights() {
  const { state, hydrated } = useDemoData();
  if (!hydrated) return null;
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
      <p className="font-semibold">{state.company.regionNote}</p>
      <p className="mt-1 text-sky-800/90">{state.company.transparencyNote}</p>
    </div>
  );
}
