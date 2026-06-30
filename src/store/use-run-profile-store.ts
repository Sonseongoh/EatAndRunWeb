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
      storage: createJSONStorage(() => localStorage)
    }
  )
);
