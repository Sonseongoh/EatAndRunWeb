"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HistoryEntry } from "@/lib/types";

type HistoryState = {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  removeEntry: (id: string) => void;
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
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id)
        })),
      clearEntries: () => set({ entries: [] })
    }),
    {
      name: "eat-run-history",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
