"use client";

import { Alert, Button, Form, Input } from "antd";
import { useState } from "react";
import { api, errorMessage } from "@/client/api";
import { Logo } from "../layout/Logo";
import styles from "./LoginForm.module.css";

type Fields = { username: string; password: string };

/** Only same-site paths, so ?next= can't bounce you to another origin after login. */
const safeNext = () => {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
};

export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async ({ username, password }: Fields) => {
    setBusy(true);
    setError(null);
    try {
      await api.login(username, password);
      // Full load, not router.push: the proxy and every query should see the new cookies.
      window.location.assign(safeNext());
    } catch (err) {
      setError(await errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo />
          Tubewise
        </div>
        <h1 className={styles.title}>Log in</h1>
        {error && <Alert type="error" message={error} showIcon className={styles.alert} />}
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
      </div>
    </div>
  );
};
