# PRD: 완수 루프 닫기 (Completion Loop)

> 라벨: `ready-for-agent`
> 관련 ADR: [0001](../adr/0001-completion-is-manual-first.md) · [0002](../adr/0002-re-engagement-without-push.md) · [0003](../adr/0003-web-pwa-first-then-native.md) · [0004](../adr/0004-anonymous-first-login-to-save-streak.md)
> 용어집: [CONTEXT.md](../../CONTEXT.md)

## Problem Statement

사용자는 음식을 찍어 칼로리를 확인하고 권장 운동(걷기/빠른걸음/달리기)과 경로까지 받지만, 그 운동을 **실제로 했는지**를 표시하거나 돌아볼 방법이 없다. 제품은 사용자를 "계획(Plan)"까지만 데려다주고, 정작 가치의 핵심인 "실제로 태웠다(완수, Completion)"에서 멈춘다. 그 결과 사용자는 며칠 쓰다 동기를 잃고, 자신이 꾸준히 하고 있다는 감각을 얻지 못한다.

## Solution

다리(Bridge)의 반대쪽 끝 — **완수(Completion)** — 를 제품에 도입한다. 사용자는 기록에서 계획을 **1탭으로 "했어요"** 표시할 수 있고, 앱을 다시 열면 **오늘의 미완료 계획(Pending Plan)**을 가장 먼저 직면해 그 자리에서 완료를 닫을 수 있다. 완수를 이어가면 **연속 기록(Streak)**이 쌓여 "오늘 끊지 말자"는 동기를 준다. 당일 안에 완수되지 않은 계획은 잔소리 없이 **놓침(Missed)**으로 마감되어 통계로만 남는다.

이 PRD는 ADR-0001·0002·0003에 따라 **수동 완수 · 푸시 없는 재방문 직면 · 웹(익명 쿠키) 기반**으로 완수 루프를 닫아, "사람들이 실제로 완수를 누르는가"라는 핵심 가설을 싸게 검증하는 것을 목표로 한다.

## User Stories

1. As a 사용자, I want 기록된 계획을 1탭으로 "했어요"로 표시하기를, so that 내가 실제로 운동했다는 사실을 남길 수 있다.
2. As a 사용자, I want 이미 완수한 계획이 "완료"로 명확히 보이기를, so that 무엇을 했고 무엇이 남았는지 한눈에 구분한다.
3. As a 사용자, I want 실수로 누른 완료를 다시 해제하기를, so that 잘못된 완수 기록을 바로잡을 수 있다.
4. As a 사용자, I want 앱을 다시 열었을 때 오늘 만든 미완료 계획을 가장 먼저 보기를, so that 돌아오자마자 완료를 닫을 수 있다.
5. As a 사용자, I want 오늘의 미완료 계획이 없으면 직면 화면이 뜨지 않기를, so that 불필요한 방해를 받지 않는다.
6. As a 사용자, I want 어제 이전의 미완료 계획이 더 이상 나에게 "하셨나요?"라고 묻지 않기를, so that 죄책감 더미에 압도되지 않는다.
7. As a 사용자, I want 당일 완수하지 못한 계획이 자동으로 "놓침"으로 정리되기를, so that 지난 계획이 영원히 미완료로 남아 어수선해지지 않는다.
8. As a 사용자, I want 내 연속 완수 일수(Streak)를 보기를, so that 꾸준함의 감각과 이어가고 싶은 동기를 얻는다.
9. As a 사용자, I want 하루라도 완수하지 못하면 Streak이 끊기는 것을 보기를, so that 매일 닫아야 한다는 압박이 작동한다.
10. As a 사용자, I want 오늘 계획을 하나라도 완수하면 Streak이 유지/증가하기를, so that 여러 번 먹은 날에도 한 번의 완수로 그날을 인정받는다.
11. As a 사용자, I want 기록 목록에서 각 계획이 미완료/완료/놓침 중 무엇인지 구분되기를, so that 내 실행 이력을 정확히 이해한다.
12. As a 사용자, I want 완수 시각이 기록되기를, so that 언제 운동했는지 돌아볼 수 있다.
13. As a 익명 사용자(로그인 없이), I want 완수·Streak 기능을 그대로 쓰기를, so that 가입 없이도 완수 루프를 경험한다.
14. As a 사용자, I want 완수 표시가 즉시 반영되기를(낙관적 업데이트), so that 느린 네트워크에서도 버튼이 반응 없는 듯 느껴지지 않는다.
15. As a 사용자, I want 완수 표시가 서버 저장에 실패하면 안내받고 원상복구되기를, so that 실제로 저장되지 않은 완수를 완수로 오인하지 않는다.
16. As a 사용자, I want 누적 통계(차트)가 놓친 계획이 아니라 실제 완수를 반영하기를, so that 통계가 내 실제 활동을 정직하게 보여준다.
17. As a 사용자, I want 하루의 경계가 한국 시간(KST) 기준으로 처리되기를, so that 밤 늦게 한 완수가 의도와 다른 날로 집계되지 않는다.

## Implementation Decisions

- **도메인 타입 확장**: `HistoryEntry`(이미 `plan?`을 가짐)에 완수 상태를 추가한다. 저장값은 **이진 + 완료 시각**으로 한정한다(ADR: 이진 완료). DB(`history_entries`)엔 `completed_at timestamptz null` 컬럼 하나만 추가한다(완료=값 존재, 미완료=null). 별도 boolean을 두지 않아 "완료 여부 + 언제"를 한 컬럼으로 표현한다.

- **Missed는 저장하지 않고 파생한다**: 웹엔 자정 크론이 없으므로 놓침은 읽는 시점에 계산한다. 한 계획의 상태는 `(completed_at, createdAt, now)`의 함수:
  - `completed_at`이 있으면 → **completed**
  - 없고 `createdAt`이 오늘(KST)이면 → **pending**
  - 없고 `createdAt`이 과거(KST)면 → **missed**

- **핵심 이음새 = `src/lib/completion.ts` (신규, 순수 함수)**: 완수 루프 로직을 한곳에 모은다. DB/UI/네트워크 의존 없음.
  - `deriveCompletionState(entry, now): "pending" | "completed" | "missed"`
  - `selectPendingToday(entries, now): HistoryEntry[]` — 재방문 직면 대상(오늘 생성 + 미완료)
  - `computeStreak(entries, now): number` — "그날 생성된 계획을 하나라도 완수한 날"의 연속 일수. 끊김 규칙: 완수가 있는 날의 연속. 모든 날짜 경계는 KST.
  - 날짜 경계 유틸은 기존 API 라우트의 KST 변환(`toStartOfDayKstIso`/`toEndOfDayKstIso`) 규약과 일치시킨다.

- **매핑 이음새 = `src/lib/history-record.ts`**: `toHistoryDbRow`/`fromHistoryDbRow`에 `completed_at` ↔ `entry.completion?.completedAt` 매핑을 추가한다. 기존처럼 순수 함수로 유지.

- **API = `src/app/api/v1/history/route.ts`에 완료 토글 동작 추가**: 기존 GET/POST/DELETE에 더해 **PATCH** 하나를 추가한다. 입력은 `{ id, completed: boolean }`. `completed=true`면 `completed_at`을 현재 시각으로, `false`면 `null`로 설정한다. `user_id` 소유권 검사는 기존 패턴(`resolveAccessContext` + `.eq("user_id", access.userId)`)을 그대로 따른다. 상태 판단 로직은 라우트에 두지 않고 Seam 1에 위임해 라우트를 얇게 유지한다.

- **상태 저장소 = `src/store/use-history-store.ts`**: 완료 토글을 낙관적으로 반영하고, PATCH 실패 시 롤백 + 사용자 안내(기존 에러 메시지 규약 `src/lib/error-message.ts` 재사용).

- **기록 목록 UI = `src/app/history/`**: 각 항목에 완료/미완료/놓침 배지와 "했어요"/"완료 취소" 액션을 추가한다. 버튼은 기존 공통 `ActionButton`을 재사용한다. 키보드 조작 지원(기존 기록 카드 접근성 작업과 일관).

- **재방문 직면 UI**: 앱 진입 시 `selectPendingToday`가 비어있지 않으면 오늘의 미완료 계획을 먼저 보여주는 표면을 둔다(전용 섹션/모달). 비어있으면 렌더하지 않는다.

- **Streak 표시 UI**: `computeStreak` 결과를 눈에 띄는 위치에 표시한다. 누적 통계 차트(`history-summary-charts.tsx`)는 **완수된 계획만** 집계하도록 조정한다(ADR: 통계 정합성).

- **익명 지원**: 완수·Streak은 ADR-0004에 따라 익명 쿠키(`eat_run_uid`) 기반에서 그대로 동작한다. 현재 GET이 로그인 필요(`allowGuest:false`)인 점과의 정합은 별도 확인 대상(아래 Further Notes).

## Testing Decisions

- **좋은 테스트의 기준**: 구현 세부가 아니라 **외부 행동**만 검증한다. 완수 루프의 행동(어떤 입력 → 어떤 상태/Streak)을 검증하고, 내부 함수 호출 순서나 사적 구조는 검증하지 않는다.

- **테스트 도구 도입(현재 전무)**: 저장소에 테스트 러너·테스트가 전혀 없다. **Vitest**를 도입한다(Next.js/TS와 궁합이 좋고 ESM/타입 지원). `package.json`에 `test` 스크립트를 추가한다. 이 PRD가 첫 테스트 이음새다.

- **주 테스트 대상 = `src/lib/completion.ts` (Seam 1)**: 순수 함수라 DB/네트워크 없이 단위 테스트한다.
  - `deriveCompletionState`: 완료/오늘 미완료/과거 미완료 각 케이스, KST 자정 경계 직전·직후.
  - `selectPendingToday`: 오늘 미완료만 포함, 완료·과거·놓침 제외.
  - `computeStreak`: 연속/끊김/하루 여러 계획 중 하나만 완수/빈 입력 등 경계.
  - 모든 케이스에서 `now`를 인자로 주입해 시간 의존을 제거한다.

- **부 테스트 대상 = `src/lib/history-record.ts` (Seam 2)**: `to/fromHistoryDbRow`의 `completed_at` 왕복 매핑(완료/미완료) 검증.

- **Prior art**: 현재 없음. 위 두 순수 모듈이 앞으로의 단위 테스트 표준 패턴이 된다. API PATCH는 얇으므로(상태 판단을 Seam 1에 위임) 단위 테스트 부담이 작다.

## Out of Scope

- **로그인 저장 유도 + 익명→계정 기록 병합** (ADR-0004) — 별도 PRD. `migrate` 라우트가 일부 존재하나 Streak 보존 유도 UX는 다루지 않는다.
- **PWA 패키징 / 네이티브 전환 / GPS 자동 완료 판정 / wake lock** (ADR-0003) — 완수 루프 검증 이후의 향상 레이어.
- **푸시 알림 / 웹푸시** (ADR-0002) — 의도적으로 제외.
- **부분 완료(15/30분 등) 입력** — 이진 완료로 시작(향후 향상).
- **완수율 대시보드/지표 화면** — 완수 데이터가 쌓인 뒤 별도 검토.

## Further Notes

- 현재 `history` GET이 `allowGuest:false`(로그인 필요)인 반면 POST/DELETE는 게스트 허용이라, "익명으로 완수 루프 체험"이 성립하려면 익명 사용자의 기록 조회 경로가 필요하다. 구현 시 이 정합성(게스트 조회 허용 여부 또는 클라이언트 보관 전략)을 먼저 확정할 것.
- `completed_at` 컬럼 추가는 `supabase/schema.sql`에 `alter table ... add column if not exists` 패턴으로 반영한다(기존 마이그레이션 스타일과 일치).
- 날짜 경계는 반드시 KST로 통일한다(User Story 17). 기존 라우트가 이미 KST 변환을 쓰므로 그 규약을 단일 출처로 삼는다.
