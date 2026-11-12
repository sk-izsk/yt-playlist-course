import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../api"

const KEY = ["agent-tokens"] as const

export const useAgentTokens = () => {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: KEY })
  const list = useQuery({ queryKey: KEY, queryFn: api.agentTokens })
  const create = useMutation({ mutationFn: api.createAgentToken, onSuccess: refresh })
  const revoke = useMutation({ mutationFn: api.revokeAgentToken, onSuccess: refresh })
  return { list, create, revoke }
}
