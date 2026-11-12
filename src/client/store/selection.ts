import { create } from "zustand"

interface Selection {
  active: boolean
  ids: Set<string>
  start: () => void
  stop: () => void
  toggle: (id: string) => void
  setAll: (ids: string[]) => void
}

/** Library multi-select (in-memory only). While active, cards toggle instead of navigating. */
export const useSelection = create<Selection>()((set) => ({
  active: false,
  ids: new Set(),
  start: () => set({ active: true, ids: new Set() }),
  stop: () => set({ active: false, ids: new Set() }),
  toggle: (id) =>
    set((s) => {
      const ids = new Set(s.ids)
      if (ids.has(id)) {
        ids.delete(id)
      } else {
        ids.add(id)
      }
      return { ids }
    }),
  setAll: (ids) => set({ ids: new Set(ids) }),
}))
