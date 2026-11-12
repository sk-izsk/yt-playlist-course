"use client";

import { Alert, Button, Input, Popconfirm, Space, Typography } from "antd";
import { useState } from "react";
import { useAgentTokens } from "@/client/hooks/useAgentTokens";

const when = (ms?: number | null) => (ms ? new Date(ms).toLocaleString() : "never");

/** Create (shown once) and revoke the tokens the Mac's MCP server / CLI use for /api/agent/*. */
export const AgentTokens = () => {
  const { list, create, revoke } = useAgentTokens();
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);

  const add = async () => {
    const res = await create.mutateAsync(name.trim());
    setFresh(res.token);
    setName("");
  };

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
        Agent tokens let the MCP server and CLI on your Mac read lessons, upload transcripts and save notes. They can
        never delete anything. Put one in the MCP config as <code>TUBEWISE_TOKEN</code>.
      </Typography.Paragraph>
      {fresh && (
        <Alert
          type="success"
          showIcon
          closable
          onClose={() => setFresh(null)}
          title="Copy this token now. It won't be shown again."
          description={
            <Typography.Text copyable code>
              {fresh}
            </Typography.Text>
          }
        />
      )}
      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder="Token name, e.g. MacBook MCP"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={add}
        />
        <Button type="primary" onClick={add} disabled={!name.trim()} loading={create.isPending}>
          Create token
        </Button>
      </Space.Compact>
      <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
        {!list.isLoading && !list.data?.length && (
          <p style={{ margin: 0, padding: 16, color: "var(--muted)" }}>No tokens yet</p>
        )}
        {list.data?.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderTop: i ? "1px solid var(--line)" : 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {t.prefix}… · created {when(t.createdAt)} · last used {when(t.lastUsedAt)}
              </div>
            </div>
            <Popconfirm
              title={`Revoke "${t.name}"?`}
              description="Anything using it stops working."
              onConfirm={() => revoke.mutate(t.id)}
            >
              <Button danger size="small">
                Revoke
              </Button>
            </Popconfirm>
          </div>
        ))}
      </div>
    </Space>
  );
};
