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
      paceMinPerKm: 6.5,
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
