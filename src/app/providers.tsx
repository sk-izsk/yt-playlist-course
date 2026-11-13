"use client"

import { AntdRegistry } from "@ant-design/nextjs-registry"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { App, ConfigProvider } from "antd"
import { useEffect, useState, type ReactNode } from "react"
import { buildTheme, THEME_COOKIE, type Mode } from "@/client/theme/antd-theme"
import { usePrefs } from "@/client/store/prefs"
import { SessionGate } from "@/components/layout/SessionGate"

/** `serverMode` comes from the theme cookie so the server renders antd in the right colours; the browser uses the store. */
export const Providers = ({ children, serverMode }: { children: ReactNode; serverMode: Mode }) => {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } } }),
  )
  const stored = usePrefs((s) => s.mode)
  const mode = typeof window === "undefined" ? serverMode : stored

  // CSS tokens in globals.css switch on the `.dark` class; the cookie lets the next request render dark from the start.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark")
    document.cookie = `${THEME_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`
  }, [mode])

  return (
    <AntdRegistry>
      <ConfigProvider theme={buildTheme(mode)}>
        <App>
          <QueryClientProvider client={client}>
            <SessionGate>{children}</SessionGate>
          </QueryClientProvider>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  )
}
