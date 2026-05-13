"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDemoData } from "@/context/demo-data-context";

type ApplicationFormProps = {
  initialVehicleId?: string;
};

export function ApplicationForm({ initialVehicleId = "" }: ApplicationFormProps) {
  const router = useRouter();
  const { state, hydrated, addApplication } = useDemoData();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("김해");
  const [customerType, setCustomerType] = useState<"individual" | "corporate">(
    "individual",
  );
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [message, setMessage] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vehicles = useMemo(
    () => state.vehicles.filter((v) => v.status !== "hidden"),
    [state.vehicles],
  );

  if (!hydrated) {
    return <p className="text-sm text-slate-500">폼을 준비하는 중입니다…</p>;
  }

  function submit() {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError("이름과 연락처는 필수입니다.");
      return;
    }
    if (!privacy) {
      setError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    const ref = addApplication({
      name: name.trim(),
      phone: phone.trim(),
      region: region.trim() || "미입력",
      customerType,
      preferredVehicleId: vehicleId || undefined,
      message: message.trim() || "(내용 없음)",
      privacyAgreed: privacy,
    });
    if (!ref.ok) {
      setError(ref.error);
      return;
    }
    router.push(`/apply/success?ref=${encodeURIComponent(ref.mockRef)}`);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">간편 상담 신청</h2>
        <p className="text-sm text-slate-600">
          제출 즉시 데모 접수번호가 발급됩니다. 실제 결제는 연결되어 있지 않습니다.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-800">이름</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-sky-500/30 focus:ring-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-800">연락처</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-sky-500/30 focus:ring-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-800">지역</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-sky-500/30 focus:ring-2"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="김해"
          />
        </label>
        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium text-slate-800">구분</legend>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomerType("individual")}
              className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${
                customerType === "individual"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              개인
            </button>
            <button
              type="button"
              onClick={() => setCustomerType("corporate")}
              className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${
                customerType === "corporate"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              법인
            </button>
          </div>
        </fieldset>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">희망 차량</span>
          <select
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none ring-sky-500/30 focus:ring-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">선택 안 함</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">상담 요청 내용</span>
          <textarea
            className="min-h-[96px] w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-sky-500/30 focus:ring-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="희망 일정, 법인 여부, 차량 용도 등을 남겨주세요."
          />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={privacy}
          onChange={(e) => setPrivacy(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          개인정보 수집·이용에 동의합니다. (데모: 실제 약관 문구는 별도 제공 필요)
        </span>
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-sky-600 text-base font-semibold text-white shadow-md transition hover:bg-sky-700"
      >
        상담 신청하기
      </button>
    </div>
  );
}
