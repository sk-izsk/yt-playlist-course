import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../api";

/** Neon (live) or the local backup mirror (read-only); the switch exists only when the server has a mirror. */
export const useDbSource = () => {
  const q = useQuery({ queryKey: ["db-source"], queryFn: api.dbSource, staleTime: Infinity });
  const set = useMutation({
    mutationFn: api.setDbSource,
    // Full reload: every cached query belongs to the other database.
    onSuccess: () => window.location.reload(),
  });
  return { available: q.data?.available ?? false, source: q.data?.source ?? "live", set };
};
