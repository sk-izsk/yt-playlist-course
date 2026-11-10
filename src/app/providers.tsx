"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import { buildTheme } from "@/client/theme/antd-theme";
import { usePrefs } from "@/client/store/prefs";
import { AutoSync } from "@/components/layout/AutoSync";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } } }),
  );
  const mode = usePrefs((s) => s.mode);

  // CSS tokens in globals.css switch on the `.dark` class.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  return (
    <AntdRegistry>
      <ConfigProvider theme={buildTheme(mode)}>
        <App>
          <QueryClientProvider client={client}>
            <AutoSync />
            {children}
          </QueryClientProvider>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
