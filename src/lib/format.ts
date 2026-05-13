/** 금액은 항상 정수(원)로 저장하고, 표시 시 천 단위 구분만 적용합니다. */
export function formatWon(amountWon: number): string {
  if (!Number.isFinite(amountWon)) return "—";
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(amountWon))}원`;
}

export function computeDepositWon(
  vehiclePriceWon: number,
  depositPercent: number,
): number {
  const price = Math.round(vehiclePriceWon);
  const pct = Math.min(100, Math.max(0, Math.round(depositPercent)));
  return Math.round((price * pct) / 100);
}
