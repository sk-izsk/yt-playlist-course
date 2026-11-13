import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"
import { THEME_COOKIE } from "@/client/theme/antd-theme"
import { Providers } from "./providers"
import "./globals.css"

// One family (Geist) for everything; Geist Mono only for times, counts and ids.
const sans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tubewise — YouTube playlists as routes you finish",
  description: "Turn YouTube videos and playlists into courses you finish, one station at a time.",
}

// Fallback for browsers that saved dark mode before the theme cookie existed: set the class before first paint.
// Keep the key in sync with prefs.ts.
const themeScript = `try{if(JSON.parse(localStorage.getItem("courseit-prefs")).state.mode==="dark")document.documentElement.classList.add("dark")}catch(e){}`

// ponytail: reading the cookie makes every page render per request (no static HTML); fine for a one-user app.
const RootLayout = async ({ children }: LayoutProps<"/">) => {
  const mode = (await cookies()).get(THEME_COOKIE)?.value === "dark" ? "dark" : "light"
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}${mode === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers serverMode={mode}>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
