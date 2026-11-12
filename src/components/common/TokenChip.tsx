"use client"

import { CopyOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"
import { useCopy } from "@/client/hooks/useCopy"
import { displayId } from "@/shared/format"
import styles from "./common.module.css"

/** Shows the short id (before the first dash); clicking copies the full UUID v4 for Claude / Codex. */
export const TokenChip = ({ token }: { token: string }) => {
  const copy = useCopy()
  return (
    <Tooltip title={`Copy full id — ${token}`}>
      <button type="button" className={`${styles.token} mono`} onClick={() => copy(token, "Id copied")}>
        {displayId(token)} <CopyOutlined />
      </button>
    </Tooltip>
  )
}
