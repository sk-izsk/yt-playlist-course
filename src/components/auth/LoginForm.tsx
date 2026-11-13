"use client"

import { Alert, Button, Form, Input } from "antd"
import Link from "next/link"
import { useEffect, useState } from "react"
import { api, errorMessage } from "@/client/api"
import { useSession } from "@/client/hooks/useSession"
import { Logo } from "../layout/Logo"
import styles from "./LoginForm.module.css"

type Fields = { username: string; password: string }

/** Only same-site paths, so ?next= can't bounce you to another origin after login. */
const safeNext = () => {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/"
  return next.startsWith("/") && !next.startsWith("//") ? next : "/"
}

export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { user } = useSession()

  // Already logged in: skip the form. Done here, not in the proxy: only the server can tell a live session
  // (an expired access token refreshes through /me) from a dead cookie, which must still reach this form.
  useEffect(() => {
    if (user) {
      window.location.replace(safeNext())
    }
  }, [user])

  const submit = async ({ username, password }: Fields) => {
    setBusy(true)
    setError(null)
    try {
      await api.login(username, password)
      // Full load, not router.push: the proxy and every query should see the new cookies.
      window.location.assign(safeNext())
    } catch (err) {
      setError(await errorMessage(err))
      setBusy(false)
    }
  }

  // SessionGate already waited for /me; a logged-in user only sees this blank page while the redirect runs.
  if (user) {
    return <div className={styles.page} aria-busy="true" />
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo />
          Tubewise
        </div>
        <h1 className={styles.title}>Log in</h1>
        {error && <Alert type="error" title={error} showIcon className={styles.alert} />}
        <Form<Fields> layout="vertical" onFinish={submit} requiredMark={false} disabled={busy}>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Enter your username" }]}>
            <Input autoComplete="username" autoFocus size="large" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: "Enter your password" }]}>
            <Input.Password autoComplete="current-password" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={busy}>
            Log in
          </Button>
        </Form>
        <p className={styles.hint}>
          Logging in lets you add, sync and delete courses and write notes.{" "}
          <Link href="/">Browse without logging in</Link>
        </p>
      </div>
    </div>
  )
}
