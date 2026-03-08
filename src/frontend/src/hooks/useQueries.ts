import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import type { Color, Match } from "../backend.d";
import { useActor } from "./useActor";

// ─── Helper: wait for actor to be ready ──────────────────────────────────────
async function waitForActor(
  getActor: () => backendInterface | null,
  triggerRefetch: (() => void) | null = null,
  timeoutMs = 20000,
  intervalMs = 200,
): Promise<backendInterface> {
  const deadline = Date.now() + timeoutMs;
  // Trigger a refetch immediately if actor is null (e.g. after IC0508 error)
  if (!getActor() && triggerRefetch) {
    triggerRefetch();
  }
  while (Date.now() < deadline) {
    const a = getActor();
    if (a) return a;
    await new Promise<void>((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    "Backend connection timed out. Please refresh the page and try again.",
  );
}

function isAuthError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes("Unauthorized") ||
      err.message.includes("unauthorized"))
  );
}

// ─── Hook: always-fresh actor ref ────────────────────────────────────────────
// Returns a stable ref that always holds the latest actor value.
// This solves the stale closure problem in useMutation callbacks.
function useActorRef() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const actorRef = useRef<backendInterface | null>(null);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  // Also sync immediately (effect runs after render, so prime it synchronously)
  actorRef.current = actor;

  // Trigger a refetch of the actor query — used to recover from IC0508 errors
  const triggerActorRefetch = () => {
    void queryClient.invalidateQueries({ queryKey: ["actor"] });
    void queryClient.refetchQueries({ queryKey: ["actor"] });
  };

  return { actorRef, actor, isFetching, triggerActorRefetch };
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
  const { actorRef, triggerActorRefetch } = useActorRef();
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
      const resolvedActor = await waitForActor(
        () => actorRef.current,
        triggerActorRefetch,
      );
      try {
        return await resolvedActor.createMatch(name, date, maxOvers);
      } catch (err) {
        // Re-throw with a clearer message
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Unauthorized") || msg.includes("403")) {
          throw new Error("Unauthorized: Please log out and back in.");
        }
        if (msg.includes("IC0508") || msg.includes("stopped")) {
          throw new Error(
            "Canister is temporarily unavailable. Please try again in a moment.",
          );
        }
        throw new Error(`Failed to create match: ${msg}`);
      }
    },
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * attempt, 3000),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Add team mutation ────────────────────────────────────────────────────────
export function useAddTeam() {
  const { actorRef, triggerActorRefetch } = useActorRef();
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
      const resolvedActor = await waitForActor(
        () => actorRef.current,
        triggerActorRefetch,
      );
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
  const { actorRef, triggerActorRefetch } = useActorRef();
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
      const resolvedActor = await waitForActor(
        () => actorRef.current,
        triggerActorRefetch,
      );
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
  const { actorRef, triggerActorRefetch } = useActorRef();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId }: { matchId: bigint }) => {
      try {
        const resolvedActor = await waitForActor(
          () => actorRef.current,
          triggerActorRefetch,
        );
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
  const { actorRef, triggerActorRefetch } = useActorRef();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId }: { matchId: bigint }): Promise<bigint> => {
      const resolvedActor = await waitForActor(
        () => actorRef.current,
        triggerActorRefetch,
      );
      return await resolvedActor.rematch(matchId);
    },
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Save player stats mutation ──────────────────────────────────────────────
export function useSavePlayerStats() {
  const { actorRef, triggerActorRefetch } = useActorRef();
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
      const resolvedActor = await waitForActor(
        () => actorRef.current,
        triggerActorRefetch,
      );
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
    retry: false,
  });
}

// ─── Save team stats mutation ─────────────────────────────────────────────────
export function useSaveTeamStats() {
  const { actorRef, triggerActorRefetch } = useActorRef();
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
      const resolvedActor = await waitForActor(
        () => actorRef.current,
        triggerActorRefetch,
      );
      await resolvedActor.saveTeamStats(
        teamName,
        isWin,
        runsScored,
        wicketsTaken,
      );
    },
    retry: false,
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
  const { actorRef, triggerActorRefetch } = useActorRef();
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
        const resolvedActor = await waitForActor(
          () => actorRef.current,
          triggerActorRefetch,
        );
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
    retry: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["match", variables.matchId.toString()],
      });
    },
  });
}
