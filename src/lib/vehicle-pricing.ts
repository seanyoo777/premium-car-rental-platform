import { computeDepositWon } from "./format";

/** 카탈로그 없을 때 간단 추정 (mock) */
export function estimateFromNamePrice(
  priceWon: number,
  contractMonths: number,
  depositPercent = 20,
) {
  const months = Math.max(12, Math.round(contractMonths));
  const dep = Math.min(35, Math.max(10, Math.round(depositPercent)));
  const monthly = Math.round((priceWon * 0.52) / months);
  return {
    priceWon: Math.round(priceWon),
    depositPercent: dep,
    monthlyPaymentWon: Math.max(250_000, monthly),
    contractMonths: months,
    depositWon: computeDepositWon(Math.round(priceWon), dep),
  };
}
