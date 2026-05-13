"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDemoData } from "@/context/demo-data-context";
import {
  buildVehicleDraftFromCatalog,
  findCatalogMatch,
} from "@/lib/mock-vehicle-catalog";
import { estimateFromNamePrice } from "@/lib/vehicle-pricing";
import { formatWon } from "@/lib/format";
import { canEditVehicleOrContract, isReadonlyRole } from "@/lib/admin-access";
import type { VehicleStatus } from "@/lib/types";

export default function AdminVehicleNewPage() {
  const router = useRouter();
  const { addVehicle, hydrated, adminAccess } = useDemoData();
  const mut =
    canEditVehicleOrContract(adminAccess.role) && !isReadonlyRole(adminAccess.role);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    modelYear: 2026,
    priceWon: 50_000_000,
    depositPercent: 20,
    monthlyPaymentWon: 800_000,
    contractMonths: 36,
    imageUrl:
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=900&q=80",
    status: "available" as VehicleStatus,
  });
  const [catalogHint, setCatalogHint] = useState<string | null>(null);

  const match = useMemo(
    () =>
      findCatalogMatch({
        name: form.name,
        brand: form.brand,
        model: form.model,
        year: form.modelYear,
      }),
    [form.brand, form.model, form.name, form.modelYear],
  );

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  function applyCatalog() {
    const m = findCatalogMatch({
      name: form.name,
      brand: form.brand,
      model: form.model,
      year: form.modelYear,
    });
    if (!m) {
      setCatalogHint("카탈로그에 없는 차량입니다. 가격을 직접 입력하거나 수동으로 맞춰 주세요.");
      return;
    }
    const d = buildVehicleDraftFromCatalog(m, {
      name: form.name,
      brand: form.brand,
      model: form.model,
      year: form.modelYear,
    });
    setForm((f) => ({
      ...f,
      name: d.name,
      brand: d.brand,
      model: d.model,
      modelYear: d.modelYear,
      priceWon: d.priceWon,
      depositPercent: d.depositPercent,
      monthlyPaymentWon: d.monthlyPaymentWon,
      contractMonths: d.contractMonths,
      imageUrl: d.imageUrl,
    }));
    setCatalogHint(`카탈로그 매칭: ${m.id} (mock, 외부 API 없음)`);
    setStep(1);
  }

  function autoPriceFromManualPrice() {
    const est = estimateFromNamePrice(
      form.priceWon,
      form.contractMonths,
      form.depositPercent,
    );
    setForm((f) => ({
      ...f,
      priceWon: est.priceWon,
      depositPercent: est.depositPercent,
      monthlyPaymentWon: est.monthlyPaymentWon,
      contractMonths: est.contractMonths,
    }));
    setCatalogHint("가격 기준으로 월납·보증금 비율을 추정했습니다(데모).");
  }

  function submit() {
    if (!mut) return;
    if (!form.name.trim() || !form.brand.trim() || !form.model.trim()) return;
    addVehicle({
      name: form.name.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      modelYear: Number.isFinite(form.modelYear) ? Math.round(form.modelYear) : undefined,
      priceWon: Math.round(form.priceWon),
      depositPercent: Math.min(100, Math.max(0, Math.round(form.depositPercent))),
      monthlyPaymentWon: Math.round(form.monthlyPaymentWon),
      contractMonths: Math.max(1, Math.round(form.contractMonths)),
      imageUrl: form.imageUrl.trim(),
      status: form.status,
    });
    router.push("/admin/vehicles");
  }

  const depositWon = Math.round(
    (Math.round(form.priceWon) * Math.round(form.depositPercent)) / 100,
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">차량 등록</h1>
        <p className="text-sm text-slate-600">
          차량명·브랜드·연식만으로도 mock 카탈로그를 불러올 수 있습니다. 실제 금융 실행은 없습니다.
        </p>
        {!mut ? (
          <p className="text-xs text-amber-800">
            현재 역할은 차량 등록이 제한됩니다. (hq_admin / branch_admin)
          </p>
        ) : null}
      </header>

      <ol className="flex gap-2 text-xs font-medium text-slate-600">
        {["기본 정보", "가격·이미지", "등록"].map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 ${
              step === i ? "bg-slate-900 text-white" : "bg-slate-100"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm">
          <label className="block space-y-1">
            <span className="text-xs font-semibold">차량명 (표시명)</span>
            <input
              className="h-12 w-full rounded-xl border px-3 text-base"
              placeholder="예: 제네시스 GV80"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold">브랜드</span>
              <input
                className="h-12 w-full rounded-xl border px-3"
                placeholder="제네시스"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold">모델</span>
              <input
                className="h-12 w-full rounded-xl border px-3"
                placeholder="GV80"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">연식</span>
            <input
              type="number"
              className="h-12 w-full rounded-xl border px-3"
              value={form.modelYear}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  modelYear: Number(e.target.value) || 2026,
                }))
              }
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={applyCatalog}
              className="h-12 flex-1 rounded-xl bg-sky-600 text-sm font-semibold text-white"
            >
              카탈로그에서 불러오기
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
            >
              직접 입력으로
            </button>
          </div>
          {match ? (
            <p className="text-xs text-emerald-700">
              미리보기: 카탈로그 후보 <span className="font-mono">{match.id}</span>{" "}
              감지됨
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              브랜드·모델·연식을 입력하면 mock 카탈로그를 찾습니다.
            </p>
          )}
          {catalogHint ? (
            <p className="text-xs text-slate-600">{catalogHint}</p>
          ) : null}
        </section>
      ) : null}

      {step >= 1 ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm">
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            <div className="relative h-40 w-full bg-slate-200">
              <Image
                src={form.imageUrl}
                alt="미리보기"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="font-semibold text-slate-900">{form.name || "차량명"}</p>
              <p className="text-xs text-slate-600">
                {form.brand} {form.model}{" "}
                {form.modelYear ? `· ${form.modelYear}년식` : ""}
              </p>
              <dl className="grid grid-cols-2 gap-1 text-xs">
                <dt className="text-slate-500">차량가</dt>
                <dd className="text-right font-medium">{formatWon(form.priceWon)}</dd>
                <dt className="text-slate-500">보증금</dt>
                <dd className="text-right">
                  {formatWon(depositWon)}{" "}
                  <span className="text-slate-500">({form.depositPercent}%)</span>
                </dd>
                <dt className="text-slate-500">월납(예상)</dt>
                <dd className="text-right font-semibold text-sky-800">
                  {formatWon(form.monthlyPaymentWon)}
                </dd>
              </dl>
            </div>
          </div>

          <button
            type="button"
            onClick={autoPriceFromManualPrice}
            className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-800"
          >
            현재 차량가로 월납·보증금 재추정
          </button>

          <label className="block space-y-1">
            <span className="text-xs font-semibold">차량가격(원)</span>
            <input
              type="number"
              className="h-11 w-full rounded-xl border px-3"
              value={form.priceWon}
              onChange={(e) =>
                setForm((f) => ({ ...f, priceWon: Number(e.target.value) }))
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">보증금 비율(%)</span>
            <input
              type="number"
              className="h-11 w-full rounded-xl border px-3"
              value={form.depositPercent}
              onChange={(e) =>
                setForm((f) => ({ ...f, depositPercent: Number(e.target.value) }))
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">월 납입 예상액(원)</span>
            <input
              type="number"
              className="h-11 w-full rounded-xl border px-3"
              value={form.monthlyPaymentWon}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  monthlyPaymentWon: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">계약기간(개월)</span>
            <input
              type="number"
              className="h-11 w-full rounded-xl border px-3"
              value={form.contractMonths}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  contractMonths: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">이미지 URL</span>
            <input
              className="h-11 w-full rounded-xl border px-3"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">차량 상태</span>
            <select
              className="h-11 w-full rounded-xl border px-3"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as VehicleStatus }))
              }
            >
              <option value="available">available</option>
              <option value="reserved">reserved</option>
              <option value="contracted">contracted</option>
              <option value="maintenance">maintenance</option>
              <option value="hidden">hidden</option>
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="h-12 flex-1 rounded-xl border text-sm font-semibold"
            >
              이전
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!mut}
              className="h-12 flex-[2] rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              등록 완료
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
