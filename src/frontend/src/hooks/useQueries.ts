import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Color, Match } from "../backend.d";
import { useActor } from "./useActor";

// ─── List all matches ─────────────────────────────────────────────────────────
export function useListMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMatches();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// ─── Get single match (public polling) ───────────────────────────────────────
export function useGetMatch(matchId: bigint | null, pollInterval?: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Match | null>({
    queryKey: ["match", matchId?.toString()],
    queryFn: async () => {
      if (!actor || matchId === null) return null;
      return actor.getMatch(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== null,
    refetchInterval: pollInterval ?? false,
  });
}

// ─── Check if caller is admin ─────────────────────────────────────────────────
export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ─── Create match mutation ────────────────────────────────────────────────────
export function useCreateMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      date,
      maxOvers,
    }: {
      name: string;
      date: bigint;
      maxOvers: bigint | null;
    }) => {
      if (!actor)
        throw new Error("Actor not ready - please try again in a moment");
      return actor.createMatch(name, date, maxOvers);
    },
    retry: 2,
    retryDelay: 1000,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Add team mutation ────────────────────────────────────────────────────────
export function useAddTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId,
      teamName,
      color,
    }: {
      matchId: bigint;
      teamName: string;
      color: Color;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addTeam(matchId, teamName, color);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["match", variables.matchId.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Add player mutation ──────────────────────────────────────────────────────
export function useAddPlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId,
      teamId,
      playerName,
      jerseyNumber,
    }: {
      matchId: bigint;
      teamId: bigint;
      playerName: string;
      jerseyNumber: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addPlayer(matchId, teamId, playerName, jerseyNumber);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["match", variables.matchId.toString()],
      });
    },
  });
}
