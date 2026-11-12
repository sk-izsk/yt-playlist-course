import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CourseSummary } from "@/shared/types";
import { api } from "../api";
import { qk } from "../query-keys";

/** Optimistically rewrites the cached course list, rolling back if the server rejects. */
const useOptimisticCourses = <V>(
  mutationFn: (v: V) => Promise<unknown>,
  apply: (list: CourseSummary[], v: V) => CourseSummary[],
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: qk.courses });
      const prev = qc.getQueryData<CourseSummary[]>(qk.courses);
      if (prev) qc.setQueryData(qk.courses, apply(prev, v));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.courses, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.courses }),
  });
};

export const useTogglePin = () =>
  useOptimisticCourses(
    ({ token, pinned }: { token: string; pinned: boolean }) => api.setPinned(token, pinned),
    (list, { token, pinned }) => list.map((c) => (c.token === token ? { ...c, pinned } : c)),
  );

/** `tokens` is the whole list in its new order. */
export const useReorderCourses = () =>
  useOptimisticCourses(api.reorderCourses, (list, tokens: string[]) => {
    const byToken = new Map(list.map((c) => [c.token, c]));
    return tokens.flatMap((t) => byToken.get(t) ?? []);
  });
