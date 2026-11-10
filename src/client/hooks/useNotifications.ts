import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { qk } from "../query-keys";

/** Server activity feed (updates found, videos added, failures). Polls so background events show up. */
export const useNotifications = () =>
  useQuery({
    queryKey: qk.notifications,
    queryFn: api.notifications,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

export const useNotificationActions = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.notifications });
  return {
    markRead: useMutation({ mutationFn: api.markNotificationsRead, onSuccess: refresh }),
    clear: useMutation({ mutationFn: api.clearNotifications, onSuccess: refresh }),
  };
};
