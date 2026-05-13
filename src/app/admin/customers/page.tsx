"use client";

import { useMemo, useState } from "react";
import { ApplicationTimeline } from "@/components/admin/application-timeline";
import { useDemoData } from "@/context/demo-data-context";
import { buildApplicationTimeline } from "@/lib/application-timeline";
import { canManageCustomers, isReadonlyRole } from "@/lib/admin-access";
import { phoneDigits } from "@/lib/phone";
import type { CustomerType } from "@/lib/types";

export default function AdminCustomersPage() {
  const { state, adminLists, adminAccess, hydrated, addCustomer, updateCustomer } =
    useDemoData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    region: "",
    customerType: "individual" as CustomerType,
    preferredVehicleId: "",
  });

  const selected = useMemo(
    () => adminLists.customers.find((c) => c.id === selectedId) ?? null,
    [selectedId, adminLists.customers],
  );

  const mut = canManageCustomers(adminAccess.role) && !isReadonlyRole(adminAccess.role);

  const appsByPhone = useMemo(() => {
    if (!selected) return [];
    const d = phoneDigits(selected.phone);
    return state.applications.filter((a) => phoneDigits(a.phone) === d);
  }, [selected, state.applications]);

  if (!hydrated) return <p className="text-sm text-slate-600">불러오는 중…</p>;

  function submit() {
    if (!form.name.trim() || !form.phone.trim()) return;
    addCustomer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      region: form.region.trim() || "미입력",
      customerType: form.customerType,
      preferredVehicleId: form.preferredVehicleId || undefined,
    });
    setForm({
      name: "",
      phone: "",
      region: "",
      customerType: "individual",
      preferredVehicleId: "",
    });
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">회원 관리</h1>
        <p className="text-sm text-slate-600">
          데모 회원을 수동 등록합니다. 실제 본인인증·CRM 연동은 없습니다.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900">회원 등록</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <input
              className="h-10 rounded-xl border border-slate-200 px-2"
              placeholder="이름"
              value={form.name}
              disabled={!mut}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-2"
              placeholder="연락처"
              value={form.phone}
              disabled={!mut}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-2"
              placeholder="지역"
              value={form.region}
              disabled={!mut}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            />
            <select
              className="h-10 rounded-xl border border-slate-200 px-2"
              value={form.customerType}
              disabled={!mut}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  customerType: e.target.value as CustomerType,
                }))
              }
            >
              <option value="individual">개인</option>
              <option value="corporate">법인</option>
            </select>
            <select
              className="h-10 rounded-xl border border-slate-200 px-2"
              value={form.preferredVehicleId}
              disabled={!mut}
              onChange={(e) =>
                setForm((f) => ({ ...f, preferredVehicleId: e.target.value }))
              }
            >
              <option value="">희망 차량 없음</option>
              {adminLists.vehicles
                .filter((v) => v.status !== "hidden")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={submit}
              disabled={!mut}
              className="h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              등록
            </button>
          </div>
        </section>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">연락처</th>
                  <th className="px-3 py-2">지역</th>
                  <th className="px-3 py-2">구분</th>
                </tr>
              </thead>
              <tbody>
                {adminLists.customers.map((c) => (
                  <tr
                    key={c.id}
                    className={`cursor-pointer border-t border-slate-100 ${
                      selectedId === c.id ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2">{c.phone}</td>
                    <td className="px-3 py-2">{c.region}</td>
                    <td className="px-3 py-2 text-xs">
                      {c.customerType === "corporate" ? "법인" : "개인"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 p-4">
            {selected ? (
              <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold text-slate-500">선택 회원</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs">이름</span>
                    <input
                      className="h-9 w-full rounded-lg border px-2"
                      value={selected.name}
                      disabled={!mut}
                      onChange={(e) =>
                        updateCustomer(selected.id, { name: e.target.value })
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs">연락처</span>
                    <input
                      className="h-9 w-full rounded-lg border px-2"
                      value={selected.phone}
                      disabled={!mut}
                      onChange={(e) =>
                        updateCustomer(selected.id, { phone: e.target.value })
                      }
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs">지역</span>
                    <input
                      className="h-9 w-full rounded-lg border px-2"
                      value={selected.region}
                      disabled={!mut}
                      onChange={(e) =>
                        updateCustomer(selected.id, { region: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-600">
                    동일 연락처 신청 타임라인
                  </p>
                  {appsByPhone.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">
                      매칭되는 신청이 없습니다.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-4">
                      {appsByPhone.map((app) => {
                        const linked =
                          app.linkedContractId != null
                            ? state.contracts.find(
                                (c) => c.id === app.linkedContractId,
                              ) ?? null
                            : state.contracts.find(
                                (c) => c.applicationId === app.id,
                              ) ?? null;
                        const rows = buildApplicationTimeline(
                          app,
                          linked,
                          state.payments,
                        );
                        return (
                          <div key={app.id} className="rounded-lg bg-slate-50 p-2">
                            <p className="text-[11px] font-medium text-slate-800">
                              {app.mockRef} · {app.status}
                            </p>
                            <ApplicationTimeline rows={rows} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">회원을 선택하세요.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
