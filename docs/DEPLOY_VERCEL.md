# Vercel 배포 체크리스트

이 프로젝트는 Next.js 프론트엔드(`src`)와 Express 백엔드(`backend`)가 분리되어 있습니다.
Vercel에는 프론트엔드를 배포하고, 백엔드는 별도 호스팅(Render/Railway/Fly 등)에 배포하는 구성을 권장합니다.

## 1. 배포 전 점검

1. `npm run build`가 로컬에서 성공해야 합니다.
2. 백엔드가 먼저 배포되어 공개 URL이 있어야 합니다.
3. 백엔드 `CORS_ORIGIN`에 프론트 도메인(`https://<project>.vercel.app`)을 포함해야 합니다.
4. 비밀키(`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)는 저장소에 커밋하지 않습니다.

## 2. Vercel 프로젝트 생성

1. Vercel에서 GitHub 저장소 `EatAndRunWeb`를 Import 합니다.
2. Framework Preset은 `Next.js`를 선택합니다.
3. Root Directory는 저장소 루트(`/`)를 사용합니다.
4. Build Command는 `npm run build`, Install Command는 `npm install`로 설정합니다.

## 3. Vercel 환경변수 설정

Vercel Project Settings > Environment Variables에 아래 값을 추가합니다.

```env
ANALYZE_API_URL=https://<백엔드-도메인>/v1/food/analyze
BACKEND_API_KEY=<백엔드와 동일한 값, 선택>
GOOGLE_MAPS_API_KEY=<선택>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<선택>
SUPABASE_URL=<필수>
SUPABASE_SERVICE_ROLE_KEY=<필수>
```

주의:
- `ANALYZE_API_URL`에 `localhost`를 넣으면 배포 환경에서 분석 API가 실패합니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 값이며 `NEXT_PUBLIC_` 접두사를 사용하면 안 됩니다.

## 4. 배포 후 검증

1. `https://<project>.vercel.app` 접속
2. `/analyze`에서 이미지 업로드 테스트
3. `/activity`, `/map` 이동 및 경로 추천 확인
4. `/history` 저장/조회 동작 확인
5. Vercel Functions 로그에서 500 에러 여부 확인

## 5. 자주 발생하는 실패 원인

1. `ANALYZE_API_URL` 누락 또는 `localhost`로 설정
2. 백엔드 CORS에 Vercel 도메인 미등록
3. `SUPABASE_SERVICE_ROLE_KEY` 누락
4. `BACKEND_API_KEY` 프론트/백엔드 값 불일치
