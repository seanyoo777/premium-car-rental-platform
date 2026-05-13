import type { Application } from "./types";
import { phoneDigits } from "./phone";

export function findApplicationByRefAndPhone(
  applications: Application[],
  mockRef: string,
  phone: string,
): Application | null {
  const ref = mockRef.trim().toUpperCase();
  const d = phoneDigits(phone);
  return (
    applications.find(
      (a) => a.mockRef.trim().toUpperCase() === ref && phoneDigits(a.phone) === d,
    ) ?? null
  );
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
