# Eat & Run Service

음식 사진 분석부터 러닝 경로 추천까지 한 번에 이어지는 실행형 건강 루틴 서비스입니다.

- 프론트엔드: Next.js (`/src`)
- 백엔드: Express (`/backend`)

## 주요 기능
- 사진 업로드 기반 음식/칼로리 분석
- 목표 소모 칼로리 기반 운동 방식(걷기/빠른걸음/달리기) 및 시간 계산
- 지도 기반 러닝 경로 추천
- Supabase 기반 기록 저장 및 조회(무한 스크롤)
- 공통 `ActionButton` 컴포넌트 기반 버튼 재사용
- 기기별 익명 사용자 쿠키(`eat_run_uid`) 기반 기록 분리

## 화면 흐름
1. `1단계 /analyze`: 음식 사진 업로드 및 분석
2. `2단계 /activity`: 운동 방식/비율/몸무게 설정
3. `3단계 /map`: 추천 경로 확인 및 외부 지도 열기
4. `기록 /history`: 누적 기록 조회/필터/삭제

## 환경 변수

### 1) 백엔드 `backend/.env`
```env
OPENAI_API_KEY=YOUR_REAL_OPENAI_KEY
BACKEND_API_KEY=
ANALYZE_RATE_LIMIT_PER_MINUTE=5
TEXT_ANALYZE_RATE_LIMIT_PER_MINUTE=10
ANALYZE_IP_RATE_LIMIT_PER_MINUTE=20
TEXT_ANALYZE_IP_RATE_LIMIT_PER_MINUTE=40
ANALYZE_RATE_LIMIT_WINDOW_MS=60000
GOOGLE_MAPS_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### 2) 프론트 `.env.local`
```env
ANALYZE_API_URL=http://localhost:4000/v1/food/analyze
BACKEND_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

- `BACKEND_API_KEY`를 백엔드에서 사용하면 프론트 `.env.local`에도 같은 값을 넣어주세요.
- Supabase 스키마는 `supabase/schema.sql`을 Supabase SQL Editor에서 실행해 생성합니다.
- 기존에 스키마를 이미 적용했다면 `supabase/schema.sql`을 다시 실행해 `history_entries.user_id` 컬럼을 반영해 주세요.

## 실행 방법

### 의존성 설치
```bash
cd C:\Users\user\Desktop\coding\eat-run-service
npm install
npm --prefix backend install
```

### 백엔드 실행
```bash
npm run backend:start
```

### 프론트엔드 실행
```bash
npm run dev
```

### 빌드 확인
```bash
npm run build
```

## 배포

- Vercel 배포 체크리스트: `docs/DEPLOY_VERCEL.md`
- Render 무료 플랜 keep-alive: GitHub Actions `.github/workflows/render-keep-alive.yml`이 `12분`마다 Render 백엔드의 `/health`를 호출합니다.
- 필요한 GitHub Actions 시크릿: `RENDER_HEALTHCHECK_URL=https://eatandrunweb.onrender.com/health`

