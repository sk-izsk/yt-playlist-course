"use client"

import { LogoutOutlined } from "@ant-design/icons"
import { Button, Tooltip } from "antd"
import { api } from "@/client/api"

export const logout = async () => {
  await api.logout().catch(() => {}) // cookies are cleared server-side; go home either way
  // Home, as a visitor. Full load on purpose: drops the logged-out user's cached queries.
  window.location.assign("/")
}

export const LogoutButton = () => (
  <Tooltip title="Log out">
    <Button
      shape="circle"
      type="text"
      aria-label="Log out"
      icon={<LogoutOutlined />}
      style={{ border: "1px solid var(--line)" }}
      onClick={logout}
    />
  </Tooltip>
)
