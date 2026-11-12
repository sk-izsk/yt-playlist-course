"use client";

import { Segmented, Typography } from "antd";
import { useDbSource } from "@/client/hooks/useDbSource";

/** Live Neon vs the Mac's local mirror. The mirror is read-only: the server refuses every write while it's chosen. */
export const DataSource = () => {
  const { available, source, set } = useDbSource();
  if (!available) {
    return (
      <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
        No local backup configured. Set <code>LOCAL_DATABASE_URL</code> in <code>.env.local</code> and run{" "}
        <code>make db-backup</code> (or <code>make backup-install</code> for every 15 minutes) to get a read-only mirror here.
      </Typography.Paragraph>
    );
  }
  return (
    <div>
      <Segmented
        value={source}
        disabled={set.isPending}
        onChange={(v) => set.mutate(v as "live" | "backup")}
        options={[
          { value: "live", label: "Neon (live)" },
          { value: "backup", label: "Local backup (read-only)" },
        ]}
      />
      <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
        The backup is refreshed by <code>make db-backup</code> / the 15-minute launchd job. Disaster recovery: point{" "}
        <code>DATABASE_URL</code> at it.
      </Typography.Paragraph>
    </div>
  );
};
