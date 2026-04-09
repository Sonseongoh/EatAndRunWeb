# Gstack 명령어 가이드

기획, 리뷰, QA, 디자인, 배포 명령을 빠르게 찾기 위한 요약 문서입니다.

## 제품 기획

| 명령어 | 역할 | 목적 |
| --- | --- | --- |
| `/office-hours` | YC Office Hours | 코딩 전에 6가지 강제 질문으로 제품 문제를 재정의하고 가정을 검증 |
| `/plan-ceo-review` | 창업자 / CEO | 10-star 제품 관점으로 문제 재정의, 모드: Expansion / Selective / Hold / Reduction |
| `/plan-eng-review` | 엔지니어링 매니저 | 아키텍처, 데이터 플로우, 에지 케이스, 숨은 가정 확정 |
| `/plan-design-review` | 시니어 디자이너 | plan-mode 디자인 리뷰, 차원별 점수화(0~10) 및 개선 |
| `/autoplan` | 리뷰 파이프라인 | CEO -> Design -> Eng 리뷰를 자동 순차 실행, 취향 판단만 사용자 확인 |

## 디자인 작업

| 명령어 | 역할 | 목적 |
| --- | --- | --- |
| `/design-consultation` | 디자인 파트너 | 디자인 시스템 구성, 창의적 방향 제안, 목업 생성 |
| `/design-review` | 코드하는 디자이너 | 라이브 UI 시각 감사 + 수정 루프(atomic commit) |
| `/design-shotgun` | 디자인 탐색기 | 여러 AI 디자인 시안을 생성하고 비교 보드에서 선택 |

## 코드 품질 / 디버깅 / QA / 보안

| 명령어 | 역할 | 목적 |
| --- | --- | --- |
| `/review` | Staff Engineer | 프로덕션 버그/리스크 탐지, 수정 포인트 제시 |
| `/investigate` | 디버거 | 근본 원인 중심 디버깅, 데이터 플로우 추적, 가설 검증 |
| `/qa` | QA Lead | 테스트 -> 버그 발견 -> 수정 -> 재검증까지 실행 |
| `/qa-only` | QA 리포터 | `/qa` 방식으로 테스트하되 코드 수정 없이 리포트만 생성 |
| `/cso` | Chief Security Officer | OWASP Top 10 + STRIDE 기반 보안 감사 |

## 브라우저 / 시각 검증

| 명령어 | 역할 | 목적 |
| --- | --- | --- |
| `/browse` | 시각 QA 엔지니어 | Chromium 기반 클릭 경로 검증, 스크린샷 수집 |
| `/connect-chrome` | Chrome 컨트롤러 | 실제 Chrome을 gstack 제어 모드로 실행 (Side Panel 확인) |

## 릴리즈 / 운영

| 명령어 | 역할 | 목적 |
| --- | --- | --- |
| `/ship` | 릴리즈 엔지니어 | main 동기화 -> 테스트 -> 리뷰 -> push -> PR 생성 |
| `/land-and-deploy` | 배포 매니저 | PR 머지 후 프로덕션 배포까지 전체 흐름 실행 |
| `/canary` | SRE | 배포 후 콘솔 에러/성능 저하/장애 모니터링 |
| `/benchmark` | 성능 엔지니어 | 성능 벤치마크 실행 및 비교 |
| `/setup-deploy` | 배포 설정 | 배포 환경 초기 설정 자동화 |

## 추천 흐름

1. 기획: `/office-hours` -> `/plan-ceo-review` -> `/plan-eng-review`
2. 자동 리뷰: `/autoplan`
3. 릴리즈 전 점검: `/review` + `/qa` (수정 없이 리포트만 필요하면 `/qa-only`)
4. 배포: `/ship` -> `/land-and-deploy` -> `/canary`
