import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import type { CourseSummary } from "@/shared/types";
import { api, errorMessage } from "../api";
import { qk } from "../query-keys";

export const useCourse = (token: string) => {
  return useQuery({
    queryKey: qk.course(token),
    queryFn: () => api.course(token),
    // Keep polling while transcripts are still being fetched in the background.
    refetchInterval: (q) => (q.state.data?.lessons.some((l) => l.transcriptStatus === "pending") ? 3000 : false),
  });
}

export const useSyncCourse = (token: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.syncCourse(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.course(token) });
      qc.invalidateQueries({ queryKey: qk.courses });
      qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}

/**
 * Removes the course from the list instantly (optimistic), shows "Deleting… → Deleted",
 * and puts it back with an error toast if the server refuses.
 */
export const useDeleteCourse = (token: string) => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const toastKey = `delete-${token}`;

  return useMutation({
    meta: { silentError: true }, // shows its own error in the "Deleting…" toast
    mutationFn: () => api.deleteCourse(token),
    onMutate: async () => {
      message.open({ key: toastKey, type: "loading", content: "Deleting course…", duration: 0 });
      await qc.cancelQueries({ queryKey: qk.courses });
      const prev = qc.getQueryData<CourseSummary[]>(qk.courses);
      const gone = prev?.find((c) => c.token === token);
      if (prev) qc.setQueryData(qk.courses, prev.filter((c) => c.token !== token));
      return { prev, title: gone?.title };
    },
    onSuccess: (_d, _v, ctx) => {
      qc.removeQueries({ queryKey: qk.course(token) });
      message.open({ key: toastKey, type: "success", content: `Deleted "${ctx?.title ?? "course"}"`, duration: 3 });
    },
    onError: async (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.courses, ctx.prev);
      message.open({ key: toastKey, type: "error", content: `Couldn't delete: ${await errorMessage(err)}` });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.courses }),
  });
};
