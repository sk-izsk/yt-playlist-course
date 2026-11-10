import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import type { CourseSummary } from "@/shared/types";
import { api } from "../api";
import { qk } from "../query-keys";

const useRefresh = () => {
  const qc = useQueryClient();
  return (token?: string) => {
    qc.invalidateQueries({ queryKey: qk.courses });
    qc.invalidateQueries({ queryKey: qk.notifications });
    if (token) qc.invalidateQueries({ queryKey: qk.course(token) });
  };
};

/** Detect-only check for one playlist; reports what it found. */
export const useCheckCourse = (token: string) => {
  const refresh = useRefresh();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: () => api.checkCourse(token),
    onSuccess: ({ available }) => {
      refresh(token);
      if (available) message.info(`${available} new video${available > 1 ? "s" : ""} available — press Update to add them`);
      else message.success("Up to date — no new videos");
    },
  });
};

/** "Update" = add the detected videos (syncCourse), for one course or many at once. */
export const useUpdateCourses = () => {
  const refresh = useRefresh();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: async (courses: CourseSummary[]) => {
      let added = 0;
      for (const c of courses) added += (await api.syncCourse(c.token)).added.length;
      return added;
    },
    onSuccess: (added) => message.success(added ? `Added ${added} new video${added > 1 ? "s" : ""}` : "Already up to date"),
    onSettled: (_d, _e, courses) => courses.forEach((c) => refresh(c.token)),
  });
};

/** Re-checks every playlist now (ignores the 30-minute throttle). */
export const useCheckAll = () => {
  const refresh = useRefresh();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: async (courses: CourseSummary[]) => {
      const playlists = courses.filter((c) => c.kind === "playlist");
      const found = await Promise.all(playlists.map((c) => api.checkCourse(c.token)));
      return found.reduce((n, f) => n + f.available, 0);
    },
    onSuccess: (n) => message.info(n ? `${n} new video${n > 1 ? "s" : ""} found` : "All playlists are up to date"),
    onSettled: () => refresh(),
  });
};
