import Link from "next/link";
import { BenefitsSection } from "@/components/customer/benefits-section";
import { BusinessHighlights } from "@/components/customer/business-highlights";
import { HeroSection } from "@/components/customer/hero-section";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-8 pb-8">
      <HeroSection />
      <BusinessHighlights />
      <BenefitsSection />
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">가격 정보 바로가기</h2>
        <p className="text-sm text-slate-600">
          차량명·월 납입·보증금·계약기간을 한 화면에서 확인하고 바로 신청할 수 있습니다.
        </p>
        <Link
          href="/vehicles"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white"
        >
          차량 검색 열기
        </Link>
      </section>
    </div>
  );
}
