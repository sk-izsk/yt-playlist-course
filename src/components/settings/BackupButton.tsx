"use client";

import { CloudSyncOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Typography } from "antd";
import { api, errorMessage } from "@/client/api";

const when = (ms: number | null) => (ms ? new Date(ms).toLocaleString() : "never");
const mb = (bytes: number | null) => (bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "");

/** "Back up now": dump Neon and refresh the local mirror on demand (the launchd job does it every 15 min). */
export const BackupButton = () => {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["backup"], queryFn: api.backupStatus });
  const run = useMutation({
    mutationFn: api.runBackup,
    meta: { silentError: true }, // shown below instead of the global toast
    onSuccess: (res) => {
      qc.setQueryData(["backup"], res.status);
      message.success("Backed up. The local mirror now matches Neon.");
    },
    onError: async (err) => message.error(await errorMessage(err)),
  });
  const s = status.data;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
      <Button icon={<CloudSyncOutlined />} loading={run.isPending} onClick={() => run.mutate()}>
        {run.isPending ? "Backing up…" : "Back up now"}
      </Button>
      <Typography.Text type="secondary">
        Last backup: {when(s?.lastAt ?? null)}
        {s?.file ? ` · ${mb(s.sizeBytes)} · ${s.dumps} of 14 dated dumps kept` : ""}
      </Typography.Text>
    </div>
  );
};
