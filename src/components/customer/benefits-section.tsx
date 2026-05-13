import { BENEFIT_PACKAGES } from "@/lib/constants";

export function BenefitsSection() {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-900">150만원 상당 패키지</h2>
        <p className="text-sm text-slate-600">
          사업 안내 기준 구성(데모 표기) ·{" "}
          <span className="font-semibold text-sky-700">3년 보증</span> 강조
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {BENEFIT_PACKAGES.map((b) => (
          <article
            key={b.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-base font-semibold text-slate-900">{b.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{b.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
