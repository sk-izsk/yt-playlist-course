import { AutoSync } from "@/components/layout/AutoSync"
import { Footer } from "@/components/layout/Footer"
import { NavBar } from "@/components/layout/NavBar"

// Everything behind login. /login sits outside this group, so it gets no nav and no background syncing.
const AppLayout = ({ children }: LayoutProps<"/">) => (
  <>
    <AutoSync />
    <NavBar />
    <main>{children}</main>
    <Footer />
  </>
)

export default AppLayout
