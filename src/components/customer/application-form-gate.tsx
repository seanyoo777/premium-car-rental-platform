"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ApplicationForm } from "@/components/customer/application-form";

function ApplicationFormWithQuery() {
  const params = useSearchParams();
  const vehicleFromQuery = params.get("vehicle") ?? "";
  return (
    <ApplicationForm
      key={vehicleFromQuery}
      initialVehicleId={vehicleFromQuery}
    />
  );
}

export function ApplicationFormGate() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">로딩 중…</p>}>
      <ApplicationFormWithQuery />
    </Suspense>
  );
}
