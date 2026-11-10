import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mode } from "../theme/antd-theme";

export const DAILY_OPTIONS = [30, 60, 90, 120] as const;

export type LibraryView = "grid" | "list";

interface Prefs {
  mode: Mode;
  dailyMinutes: number;
  view: LibraryView;
  toggleMode: () => void;
  setDailyMinutes: (m: number) => void;
  setView: (v: LibraryView) => void;
}

/** Per-browser UI preferences. Course data lives in SQLite, not here. */
export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      mode: "light",
      dailyMinutes: 60,
      view: "grid",
      toggleMode: () => set((s) => ({ mode: s.mode === "light" ? "dark" : "light" })),
      setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
      setView: (view) => set({ view }),
    }),
    { name: "courseit-prefs" },
  ),
);
