"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ActivityMode } from "@/lib/activity";
import { FoodAnalysisResponse, RouteRecommendation } from "@/lib/types";

type AnalysisSnapshot = FoodAnalysisResponse & { kcalAvg: number };

type FlowState = {
  analysis: AnalysisSnapshot | null;
  mode: ActivityMode | null;
  durationMin: number | null;
  routes: RouteRecommendation[];
  selectedRouteIndex: number;
  setAnalysis: (analysis: AnalysisSnapshot) => void;
  setRoutes: (routes: RouteRecommendation[]) => void;
  setSelectedRouteIndex: (index: number) => void;
  setActivity: (mode: ActivityMode, durationMin: number) => void;
  resetFlow: () => void;
};

export const useFlowStore = create<FlowState>()(
  persist(
    (set) => ({
      analysis: null,
      mode: null,
      durationMin: null,
      routes: [],
      selectedRouteIndex: 0,
      setAnalysis: (analysis) => set({ analysis }),
      setRoutes: (routes) => set({ routes, selectedRouteIndex: 0 }),
      setSelectedRouteIndex: (selectedRouteIndex) => set({ selectedRouteIndex }),
      setActivity: (mode, durationMin) => set({ mode, durationMin }),
      resetFlow: () =>
        set({
          analysis: null,
          mode: null,
          durationMin: null,
          routes: [],
          selectedRouteIndex: 0
        })
    }),
    {
      name: "eat-run-flow",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
