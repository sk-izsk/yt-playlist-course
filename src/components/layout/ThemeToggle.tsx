"use client"

import { MoonOutlined, SunOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { usePrefs } from "@/client/store/prefs"

export const ThemeToggle = () => {
  const { mode, toggleMode } = usePrefs()
  return (
    <Button
      shape="circle"
      type="text"
      aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleMode}
      style={{ border: "1px solid var(--line)" }}
    />
  )
}
