# Premium Car Rental Platform — Agent Guide

이 저장소는 **메인 1~8번 플랫폼과 완전 분리된 독립 프로젝트**입니다.

## 스택

- Next.js (App Router), TypeScript, Tailwind CSS
- 고객 UI: 모바일 우선, 데모/mock 데이터 (`localStorage` 키: `premium-car-rental-demo-v1`)
- 관리자: `/admin` — 표 + 상세 패널, 위험 작업은 확인 모달

## 작업 원칙

- **기존 기능/파일 임의 삭제 금지** (불가피한 경우 PR에서 근거 명시)
- **실제 결제 API·금융 실행 연결 금지** (mock만)
- 금액은 **정수 원**으로 저장, 표시는 `formatWon` 등 공용 포맷터 사용
- 계약 상태 키는 `docs/CONTRACT_SYSTEM.md`와 동기화
- 관리자 변경은 **상태 검증·감사 로그(audit)** 확장을 염두에 둔 구조 유지

## 주요 경로

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 (히어로, 혜택, 차량 검색 유도) |
| `/vehicles` | 차량 목록·가격·신청 링크 |
| `/apply` | 상담 신청 폼 |
| `/apply/success` | mock 접수번호 표시 |
| `/admin` | 관리자 대시보드 및 하위 메뉴 |

## 코드 위치

- 타입: `src/lib/types.ts`
- 데모 상태: `src/context/demo-data-context.tsx`
- 시드: `src/lib/mock-seed.ts`
- 신청→계약: `src/lib/contract-from-application.ts`
- 차량·계약 동기화: `src/lib/vehicle-contract-sync.ts`
- 고객 타임라인: `src/lib/application-timeline.ts`, `src/components/admin/application-timeline.tsx`
- 연락처 매칭: `src/lib/phone.ts`
- 고객 컴포넌트: `src/components/customer/`
- 관리자 컴포넌트: `src/components/admin/`

## 명령

- `npm run lint` — ESLint
- `npm run build` — 프로덕션 빌드

## 문서

- `MASTER_MANUAL.md` — 전체 개요
- `docs/` — 도메인별 설계 문서
