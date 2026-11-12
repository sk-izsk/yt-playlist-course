"use client";

import { AgentTokens } from "@/components/settings/AgentTokens";
import { DataSource } from "@/components/settings/DataSource";
import { TrashList } from "@/components/settings/TrashList";

const SettingsPage = () => (
  <div style={{ width: "min(760px, 100% - 32px)", margin: "40px auto" }}>
    <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Settings</h1>
    <h2 style={{ fontSize: 18, fontWeight: 600, margin: "24px 0 12px" }}>Agent tokens</h2>
    <AgentTokens />
    <h2 style={{ fontSize: 18, fontWeight: 600, margin: "40px 0 12px" }}>Data source</h2>
    <DataSource />
    <h2 style={{ fontSize: 18, fontWeight: 600, margin: "40px 0 12px" }}>Trash</h2>
    <TrashList />
  </div>
);

export default SettingsPage;
