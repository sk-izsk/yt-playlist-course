"use client"

import { CompressOutlined, ExpandOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import { Button, Popover, Segmented, Switch } from "antd"
import { SHORTCUTS } from "@/client/hooks/usePlayerShortcuts"
import { SPEEDS, usePrefs } from "@/client/store/prefs"
import styles from "./lesson.module.css"

const Keys = () => (
  <table className={styles.keys}>
    <tbody>
      {SHORTCUTS.map(([k, what]) => (
        <tr key={k}>
          <td>
            <kbd>{k}</kbd>
          </td>
          <td>{what}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

/** Speed, auto-next and theater mode, remembered across lessons. */
export const PlayerBar = () => {
  const { speed, setSpeed, autoNext, setAutoNext, theater, toggleTheater } = usePrefs()
  return (
    <div className={styles.playerBar}>
      <Segmented
        size="small"
        value={speed}
        onChange={(v) => setSpeed(Number(v))}
        options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
        aria-label="Playback speed"
      />
      <label className={styles.autoNext}>
        <Switch size="small" checked={autoNext} onChange={setAutoNext} />
        Auto-next
      </label>
      <span className={styles.spacer} />
      <Button
        size="small"
        type="text"
        icon={theater ? <CompressOutlined /> : <ExpandOutlined />}
        onClick={toggleTheater}
      >
        {theater ? "Default view" : "Theater"}
      </Button>
      <Popover content={<Keys />} title="Keyboard shortcuts" trigger="click" placement="bottomRight">
        <Button size="small" type="text" icon={<QuestionCircleOutlined />} aria-label="Keyboard shortcuts" />
      </Popover>
    </div>
  )
}
