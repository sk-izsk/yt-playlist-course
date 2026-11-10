import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mode } from "../theme/antd-theme";

export const DAILY_OPTIONS = [30, 60, 90, 120] as const;
export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export type LibraryView = "grid" | "list";

interface Prefs {
  mode: Mode;
  dailyMinutes: number;
  view: LibraryView;
  /** Player: set once, applied to every lesson. */
  speed: number;
  autoNext: boolean;
  theater: boolean;
  toggleMode: () => void;
  setDailyMinutes: (m: number) => void;
  setView: (v: LibraryView) => void;
  setSpeed: (s: number) => void;
  setAutoNext: (on: boolean) => void;
  toggleTheater: () => void;
}

/** Per-browser UI preferences. Course data lives in SQLite, not here. */
export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      mode: "light",
      dailyMinutes: 60,
      view: "grid",
      speed: 1,
      autoNext: true,
      theater: false,
      toggleMode: () => set((s) => ({ mode: s.mode === "light" ? "dark" : "light" })),
      setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
      setView: (view) => set({ view }),
      setSpeed: (speed) => set({ speed }),
      setAutoNext: (autoNext) => set({ autoNext }),
      toggleTheater: () => set((s) => ({ theater: !s.theater })),
    }),
    // ponytail: key keeps the old app name on purpose; renaming it would reset everyone's prefs.
    { name: "courseit-prefs" },
  ),
);
