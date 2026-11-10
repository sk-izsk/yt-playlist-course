import { useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useEffect } from "react";
import { errorMessage } from "../api";
import { qk } from "../query-keys";

/**
 * One place that turns any failed query or mutation into a toast, and refreshes the notification
 * center (the server logs real failures there). Mutations that show their own error set
 * `meta: { silentError: true }`.
 */
export const useErrorToasts = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();

  useEffect(() => {
    const show = async (err: unknown) => {
      const text = await errorMessage(err);
      message.error({ content: text, key: text }); // key de-dupes identical errors
      qc.invalidateQueries({ queryKey: qk.notifications });
    };

    const offQueries = qc.getQueryCache().subscribe((e) => {
      if (e.type === "updated" && e.action.type === "error") show(e.action.error);
    });
    const offMutations = qc.getMutationCache().subscribe((e) => {
      if (e.type !== "updated" || e.action.type !== "error") return;
      if (e.mutation.options.meta?.silentError) return;
      show(e.action.error);
    });
    return () => {
      offQueries();
      offMutations();
    };
  }, [qc, message]);
};
