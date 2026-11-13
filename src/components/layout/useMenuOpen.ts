import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/** Open state for the phone menu: closes on navigation and Escape, and stops the page scrolling behind it. */
export const useMenuOpen = () => {
  const [open, setOpen] = useState(false)
  const path = usePathname()

  // Render-time reset (not an effect) so the sheet never paints over the new page.
  const [lastPath, setLastPath] = useState(path)
  if (path !== lastPath) {
    setLastPath(path)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

  return { open, setOpen }
}
