import { useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useEffect } from "react";
import { api } from "../api";
import { qk } from "../query-keys";

// Once per page load — survives StrictMode's double effect and client-side navigation.
let started = false;

/** On app open, asks the server to re-check stale playlists and announces any new videos. */
export const useAutoSync = () => {
  const qc = useQueryClient();
  const { notification } = App.useApp();

  useEffect(() => {
    if (started) return;
    started = true;
    api
      .syncStale()
      .then((results) => {
        qc.invalidateQueries({ queryKey: qk.notifications });
        if (!results.length) return;
        qc.invalidateQueries({ queryKey: qk.courses });
        results.forEach((r) => qc.invalidateQueries({ queryKey: qk.course(r.token) }));
        notification.info({
          title: "New videos available",
          description: `${results.map((r) => `${r.title}: +${r.available}`).join(" · ")} — open the 🔔 to update`,
          duration: 8,
        });
      })
      .catch((err) => console.warn("[auto-sync]", err)); // offline / YouTube hiccup — not worth a toast
  }, [qc, notification]);
};
