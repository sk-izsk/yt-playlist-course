import { AutoSync } from "@/components/layout/AutoSync"
import { Footer } from "@/components/layout/Footer"
import { NavBar } from "@/components/layout/NavBar"

// Everything behind login. /login sits outside this group, so it gets no nav and no background syncing.
const AppLayout = ({ children }: LayoutProps<"/">) => (
  // Column that fills the window so the footer sits at the bottom even on short pages.
  <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
    <AutoSync />
    <NavBar />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
)

export default AppLayout
