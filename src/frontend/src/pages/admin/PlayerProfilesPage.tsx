import type { Match } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllTeamStats, useListMatches } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerProfile {
  id: number;
  name: string;
  teamName: string;
  matchesPlayed: number;
  totalRuns: number;
  totalBalls: number;
  totalWickets: number;
  strikeRate: number;
  bestBatting: string;
  bestBowling: string;
  fours: number;
  sixes: number;
  totalRunsConceded: number;
  totalOvers: number;
}

// ─── Aggregate player profiles from completed matches ─────────────────────────

function aggregateFromMatches(matches: Match[]): PlayerProfile[] {
  const profiles = new Map<number, PlayerProfile>();

  const completedMatches = matches.filter((m) => m.status === "completed");

  for (const match of completedMatches) {
    for (const team of match.teams) {
      for (const player of team.players) {
        const id = Number(player.id);
        const existing = profiles.get(id) ?? {
          id,
          name: player.name,
          teamName: team.name,
          matchesPlayed: 0,
          totalRuns: Number(player.battingStats.runs),
          totalBalls: Number(player.battingStats.ballsFaced),
          totalWickets: Number(player.bowlingStats.wickets),
          strikeRate: 0,
          bestBatting: "-",
          bestBowling: "-",
          fours: Number(player.battingStats.fours),
          sixes: Number(player.battingStats.sixes),
          totalRunsConceded: Number(player.bowlingStats.runs),
          totalOvers: Number(player.bowlingStats.overs),
        };

        if (!profiles.has(id)) {
          existing.matchesPlayed = 1;
          // Best batting
          const r = Number(player.battingStats.runs);
          const b = Number(player.battingStats.ballsFaced);
          const out = player.battingStats.isOut;
          if (r > 0) {
            existing.bestBatting = `${r}${!out ? "*" : ""} (${b}b)`;
          }
          // Best bowling
          const w = Number(player.bowlingStats.wickets);
          const rc = Number(player.bowlingStats.runs);
          if (w > 0) {
            existing.bestBowling = `${w}/${rc}`;
          }
        } else {
          // Accumulate
          existing.matchesPlayed += 1;
          existing.totalRuns += Number(player.battingStats.runs);
          existing.totalBalls += Number(player.battingStats.ballsFaced);
          existing.totalWickets += Number(player.bowlingStats.wickets);
          existing.fours += Number(player.battingStats.fours);
          existing.sixes += Number(player.battingStats.sixes);
          existing.totalRunsConceded += Number(player.bowlingStats.runs);
          existing.totalOvers += Number(player.bowlingStats.overs);

          // Update best batting
          const r = Number(player.battingStats.runs);
          const b = Number(player.battingStats.ballsFaced);
          const out = player.battingStats.isOut;
          const bestR =
            existing.bestBatting === "-"
              ? -1
              : Number.parseInt(existing.bestBatting.replace("*", ""));
          if (r > bestR) {
            existing.bestBatting = `${r}${!out ? "*" : ""} (${b}b)`;
          }

          // Update best bowling
          const w = Number(player.bowlingStats.wickets);
          const rc = Number(player.bowlingStats.runs);
          const [bestW] =
            existing.bestBowling === "-"
              ? [-1, 999]
              : existing.bestBowling.split("/").map(Number);
          if (w > (bestW ?? -1)) {
            existing.bestBowling = `${w}/${rc}`;
          }
        }

        profiles.set(id, existing);
      }
    }
  }

  // Compute strike rates
  for (const profile of profiles.values()) {
    profile.strikeRate =
      profile.totalBalls > 0
        ? Math.round((profile.totalRuns / profile.totalBalls) * 100)
        : 0;
  }

  return Array.from(profiles.values()).sort(
    (a, b) => b.totalRuns - a.totalRuns,
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerProfilesPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: matches, isLoading: matchesLoading } = useListMatches();
  const { data: teamStats, isLoading: teamStatsLoading } = useGetAllTeamStats();

  useEffect(() => {
    if (!isLoggedIn) void navigate({ to: "/admin/login" });
  }, [isLoggedIn, navigate]);

  const profiles = useMemo(
    () => aggregateFromMatches(matches ?? []),
    [matches],
  );

  const isLoading = matchesLoading || teamStatsLoading;

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-6 space-y-5 pb-28">
        {/* Back */}
        <button
          type="button"
          onClick={() => void navigate({ to: "/admin" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="players.back.button"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-foreground">
              Player &amp; Team Stats
            </h1>
            <p className="text-sm text-muted-foreground">
              Aggregated from all completed matches
            </p>
          </div>
        </div>

        {isLoading ? (
          <div data-ocid="players.loading_state" className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                key={i}
                className="h-12 rounded-xl shimmer animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* ── Player Stats Table ── */}
            {profiles.length === 0 ? (
              <div
                data-ocid="players.empty_state"
                className="text-center py-16 space-y-3"
              >
                <div className="w-16 h-16 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-foreground font-semibold">
                  No player data yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete some matches to see player profiles here.
                </p>
                <Button
                  variant="outline"
                  onClick={() => void navigate({ to: "/admin" })}
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  data-ocid="players.go_to_matches.button"
                >
                  Go to Matches
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 border-b border-border/20 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {profiles.length} Player
                    {profiles.length !== 1 ? "s" : ""} — sorted by total runs
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 bg-muted/20">
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                          Player
                        </th>
                        <th className="text-left px-2 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">
                          Team
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          M
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          Runs
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          SR
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          4s
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          6s
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          Wkts
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                          Best Bat
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                          Best Bowl
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((profile, i) => (
                        <tr
                          key={profile.id}
                          data-ocid={`players.item.${i + 1}`}
                          className="border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2.5 font-semibold text-foreground">
                            {profile.name}
                          </td>
                          <td className="px-2 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                            {profile.teamName}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                            {profile.matchesPlayed}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono font-bold text-foreground">
                            {profile.totalRuns}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono text-electric-blue">
                            {profile.strikeRate}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono text-neon-green">
                            {profile.fours}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono text-cricket-gold">
                            {profile.sixes}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono font-bold text-wicket-red">
                            {profile.totalWickets}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                            {profile.bestBatting}
                          </td>
                          <td className="text-right px-2 py-2.5 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                            {profile.bestBowling}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Team Stats Table ── */}
            {teamStats && teamStats.length > 0 && (
              <div className="rounded-xl border border-electric-blue/30 bg-card overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 border-b border-border/20 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-electric-blue" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Team Statistics — {teamStats.length} Team
                    {teamStats.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 bg-muted/20">
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                          Team
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          M
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          W
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground">
                          L
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                          Runs
                        </th>
                        <th className="text-right px-2 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                          Wkts Taken
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamStats
                        .sort(([, a], [, b]) => Number(b.wins) - Number(a.wins))
                        .map(([teamName, stats], i) => (
                          <tr
                            key={teamName}
                            data-ocid={`team_stats.item.${i + 1}`}
                            className="border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-3 py-2.5 font-semibold text-foreground">
                              {teamName}
                            </td>
                            <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                              {Number(stats.totalMatches)}
                            </td>
                            <td className="text-right px-2 py-2.5 font-mono font-bold text-neon-green">
                              {Number(stats.wins)}
                            </td>
                            <td className="text-right px-2 py-2.5 font-mono text-wicket-red">
                              {Number(stats.losses)}
                            </td>
                            <td className="text-right px-2 py-2.5 font-mono text-foreground hidden sm:table-cell">
                              {Number(stats.totalRunsScored)}
                            </td>
                            <td className="text-right px-2 py-2.5 font-mono text-electric-blue hidden sm:table-cell">
                              {Number(stats.totalWicketsTaken)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border border-noball-orange/30 bg-noball-orange/5 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-noball-orange mb-1">Note</p>
          Player stats are aggregated from completed matches stored in the
          backend. Team stats (wins/losses) are saved automatically when a match
          finishes.
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
