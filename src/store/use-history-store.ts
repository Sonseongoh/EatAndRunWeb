"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HistoryEntry } from "@/lib/types";

type HistoryState = {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  clearEntries: () => void;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 30)
        })),
      clearEntries: () => set({ entries: [] })
    }),
    {
      name: "eat-run-history",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
