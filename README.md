# Eat Run Service

This project is now fully self-contained in this folder:
- Frontend: Next.js app (`/src`)
- Backend: Express API (`/backend`)

## 1) Where to put your OpenAI key

Put your real key in:
- `C:\Users\user\Desktop\coding\eat-run-service\backend\.env`

```env
OPENAI_API_KEY=YOUR_REAL_OPENAI_KEY
```

## 2) Required env files

Backend:
- [backend/.env](C:\Users\user\Desktop\coding\eat-run-service\backend\.env)

Frontend:
- [.env.local](C:\Users\user\Desktop\coding\eat-run-service\.env.local)

```env
ANALYZE_API_URL=http://localhost:4000/v1/food/analyze
BACKEND_API_KEY=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

If you set `BACKEND_API_KEY` in backend `.env`, set the same value in `.env.local`.

## 3) Run

Install packages:
```bash
cd C:\Users\user\Desktop\coding\eat-run-service
npm install
npm --prefix backend install
```

Run backend:
```bash
npm run backend:start
```

Run frontend:
```bash
npm run dev
```

## Features
- AI food calorie analysis from photo upload
- Road-based route recommendation via Google Directions (OSRM fallback)
- History persisted with Zustand
