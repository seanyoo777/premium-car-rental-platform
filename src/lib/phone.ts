/** 연락처 매칭용 숫자만 추출 */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}
