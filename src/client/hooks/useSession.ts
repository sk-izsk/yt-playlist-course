import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

/**
 * Who is looking: a logged-in owner sees write controls (add/delete courses, notes, progress, sync);
 * everyone else browses read-only. The server enforces this anyway; this only hides buttons that would 401.
 */
export const useSession = () => {
  const me = useQuery({ queryKey: ["me"], queryFn: api.me, staleTime: 5 * 60_000 });
  return { user: me.data ?? null, canEdit: me.data?.role === "owner", loading: me.isLoading };
};
