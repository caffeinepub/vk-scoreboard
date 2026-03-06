import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { backendInterface } from "../backend";
import type { Color, Match } from "../backend.d";
import { useActor } from "./useActor";

// ─── Helper: wait for actor to be ready ──────────────────────────────────────
async function waitForActor(
  getActor: () => backendInterface | null,
  timeoutMs = 10000,
  intervalMs = 500,
): Promise<backendInterface> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const a = getActor();
    if (a) return a;
    await new Promise<void>((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    "Backend connection timed out. Please refresh and try again.",
  );
}

function isAuthError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes("Unauthorized") ||
      err.message.includes("unauthorized"))
  );
}

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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.createMatch(name, date, maxOvers);
    },
    retry: 2,
    retryDelay: 1500,
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.addTeam(matchId, teamName, color);
    },
    retry: 2,
    retryDelay: 1500,
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.addPlayer(matchId, teamId, playerName, jerseyNumber);
    },
    retry: 2,
    retryDelay: 1500,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["match", variables.matchId.toString()],
      });
    },
  });
}

// ─── Delete match mutation ────────────────────────────────────────────────────
export function useDeleteMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId }: { matchId: bigint }) => {
      try {
        const resolvedActor = await waitForActor(() => actor);
        await resolvedActor.deleteMatch(matchId);
      } catch (err) {
        if (isAuthError(err)) return; // fail silently on auth errors
        throw err;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Rematch mutation ─────────────────────────────────────────────────────────
export function useRematch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId }: { matchId: bigint }): Promise<bigint> => {
      try {
        const resolvedActor = await waitForActor(() => actor);
        return await resolvedActor.rematch(matchId);
      } catch (err) {
        if (isAuthError(err)) throw err; // caller handles auth error as fallback
        throw err;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Save player stats mutation ──────────────────────────────────────────────
export function useSavePlayerStats() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      playerId,
      matchId,
      runs,
      balls,
      fours,
      sixes,
      wickets,
      oversBowled,
      runsConceded,
    }: {
      playerId: bigint;
      matchId: bigint;
      runs: bigint;
      balls: bigint;
      fours: bigint;
      sixes: bigint;
      wickets: bigint;
      oversBowled: bigint;
      runsConceded: bigint;
    }) => {
      const resolvedActor = await waitForActor(() => actor);
      await resolvedActor.savePlayerStats(
        playerId,
        matchId,
        runs,
        balls,
        fours,
        sixes,
        wickets,
        oversBowled,
        runsConceded,
      );
    },
    retry: 2,
    retryDelay: 1500,
  });
}

// ─── Save team stats mutation ─────────────────────────────────────────────────
export function useSaveTeamStats() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      teamName,
      isWin,
      runsScored,
      wicketsTaken,
    }: {
      teamName: string;
      isWin: boolean;
      runsScored: bigint;
      wicketsTaken: bigint;
    }) => {
      const resolvedActor = await waitForActor(() => actor);
      await resolvedActor.saveTeamStats(
        teamName,
        isWin,
        runsScored,
        wicketsTaken,
      );
    },
    retry: 2,
    retryDelay: 1500,
  });
}

// ─── Get player aggregate stats query ────────────────────────────────────────
export function useGetPlayerAggregateStats(playerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["playerStats", playerId?.toString()],
    queryFn: async () => {
      if (!actor || playerId === null) return null;
      return actor.getPlayerAggregateStats(playerId);
    },
    enabled: !!actor && !isFetching && playerId !== null,
    staleTime: 30_000,
  });
}

// ─── Get all team stats query ─────────────────────────────────────────────────
export function useGetAllTeamStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["teamStats"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ─── Save innings result mutation ─────────────────────────────────────────────
export function useSaveInningsResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId,
      isFirstInnings,
      battingTeamId,
      bowlingTeamId,
      totalRuns,
      wickets,
      legalBalls,
      wides,
      noBalls,
      byes,
      legByes,
      result,
    }: {
      matchId: bigint;
      isFirstInnings: boolean;
      battingTeamId: bigint;
      bowlingTeamId: bigint;
      totalRuns: bigint;
      wickets: bigint;
      legalBalls: bigint;
      wides: bigint;
      noBalls: bigint;
      byes: bigint;
      legByes: bigint;
      result: string | null;
    }) => {
      try {
        const resolvedActor = await waitForActor(() => actor);
        await resolvedActor.saveInningsResult(
          matchId,
          isFirstInnings,
          battingTeamId,
          bowlingTeamId,
          totalRuns,
          wickets,
          legalBalls,
          wides,
          noBalls,
          byes,
          legByes,
          result,
        );
      } catch (err) {
        if (isAuthError(err)) return; // fail silently
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["match", variables.matchId.toString()],
      });
    },
  });
}
