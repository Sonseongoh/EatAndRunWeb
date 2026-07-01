"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type RunProfileState = {
  weightKg: number;
  paceMinPerKm: number;
  burnRatioPercent: number;
  startLat: number;
  startLng: number;
  setWeightKg: (next: number) => void;
  setPaceMinPerKm: (next: number) => void;
  setBurnRatioPercent: (next: number) => void;
  setStart: (lat: number, lng: number) => void;
};

export const useRunProfileStore = create<RunProfileState>()(
  persist(
    (set) => ({
      weightKg: 65,
      // 달리기 기본 페이스 7.1분/km ≈ 8.4km/h. activity.ts의 run MET(9, ≈8.4km/h)와 일치시켜 둔다.
      paceMinPerKm: 7.1,
      burnRatioPercent: 30,
      startLat: 37.5519,
      startLng: 126.9918,
      setWeightKg: (next) => set({ weightKg: next }),
      setPaceMinPerKm: (next) => set({ paceMinPerKm: next }),
      setBurnRatioPercent: (next) => set({ burnRatioPercent: next }),
      setStart: (lat, lng) => set({ startLat: lat, startLng: lng })
    }),
    {
      name: "eat-run-profile",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // paceMinPerKm은 사용자 입력 UI가 없는 계산용 기본값이라 저장하지 않는다(항상 코드값 사용).
      partialize: ({ weightKg, burnRatioPercent, startLat, startLng }) => ({
        weightKg,
        burnRatioPercent,
        startLat,
        startLng
      }),
      // 과거(version 0)에 저장돼 있던 paceMinPerKm를 제거해 새 기본값이 즉시 적용되게 한다.
      migrate: (persisted) => {
        if (persisted && typeof persisted === "object") {
          const next = { ...(persisted as Record<string, unknown>) };
          delete next.paceMinPerKm;
          return next as unknown as RunProfileState;
        }
        return persisted as RunProfileState;
      }
    }
  )
);
