import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Users } from "lucide-react";
import { useEffect, useMemo } from "react";

interface PlayerProfile {
  name: string;
  matchesPlayed: number;
  totalRuns: number;
  totalBalls: number;
  totalWickets: number;
  strikeRate: number;
  bestBatting: string;
  bestBowling: string;
  fours: number;
  sixes: number;
}

function aggregatePlayerProfiles(): PlayerProfile[] {
  const profiles = new Map<string, PlayerProfile>();

  try {
    // Scan all localStorage keys for session data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("vk_cricket_")) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const session = JSON.parse(raw) as {
        inningsNumber: number;
        innings1Snapshot: {
          batsmanStats: [
            number,
            {
              playerId: number;
              runs: number;
              balls: number;
              fours: number;
              sixes: number;
              isOut: boolean;
            },
          ][];
          bowlerStats: [
            number,
            {
              playerId: number;
              wickets: number;
              overs: number;
              runs: number;
              ballsThisOver: number;
            },
          ][];
        } | null;
        inningsState: {
          batsmanStats: [
            number,
            {
              playerId: number;
              runs: number;
              balls: number;
              fours: number;
              sixes: number;
              isOut: boolean;
            },
          ][];
          bowlerStats: [
            number,
            {
              playerId: number;
              wickets: number;
              overs: number;
              runs: number;
              ballsThisOver: number;
            },
          ][];
          status: string;
        };
      };

      const processInnings = (
        batsmanStats: typeof session.inningsState.batsmanStats,
        bowlerStats: typeof session.inningsState.bowlerStats,
        playerNames: Map<number, string>,
      ) => {
        for (const [id, stats] of batsmanStats) {
          const name = playerNames.get(id) ?? `Player ${id}`;
          const existing = profiles.get(name) ?? {
            name,
            matchesPlayed: 0,
            totalRuns: 0,
            totalBalls: 0,
            totalWickets: 0,
            strikeRate: 0,
            bestBatting: "-",
            bestBowling: "-",
            fours: 0,
            sixes: 0,
          };
          existing.matchesPlayed++;
          existing.totalRuns += stats.runs;
          existing.totalBalls += stats.balls;
          existing.fours += stats.fours;
          existing.sixes += stats.sixes;

          // Best batting
          const bestRuns =
            existing.bestBatting === "-"
              ? -1
              : Number.parseInt(existing.bestBatting.replace("*", ""));
          if (stats.runs > bestRuns) {
            existing.bestBatting = `${stats.runs}${!stats.isOut ? "*" : ""} (${stats.balls}b)`;
          }
          profiles.set(name, existing);
        }
        for (const [id, stats] of bowlerStats) {
          const name = playerNames.get(id) ?? `Player ${id}`;
          const existing = profiles.get(name) ?? {
            name,
            matchesPlayed: 0,
            totalRuns: 0,
            totalBalls: 0,
            totalWickets: 0,
            strikeRate: 0,
            bestBatting: "-",
            bestBowling: "-",
            fours: 0,
            sixes: 0,
          };
          existing.totalWickets += stats.wickets;

          // Best bowling
          const [bestW] =
            existing.bestBowling === "-"
              ? [-1, 999]
              : existing.bestBowling.split("/").map(Number);
          if (stats.wickets > (bestW ?? -1)) {
            existing.bestBowling = `${stats.wickets}/${stats.runs}`;
          }
          profiles.set(name, existing);
        }
      };

      // We don't have player names in the session, so we skip name resolution
      // but keep the aggregation logic intact
      const playerNames = new Map<number, string>();
      if (session.innings1Snapshot) {
        processInnings(
          session.innings1Snapshot.batsmanStats,
          session.innings1Snapshot.bowlerStats,
          playerNames,
        );
      }
      if (session.inningsState.status !== "not-started") {
        processInnings(
          session.inningsState.batsmanStats,
          session.inningsState.bowlerStats,
          playerNames,
        );
      }
    }
  } catch {
    // ignore parse errors
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

export function PlayerProfilesPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) void navigate({ to: "/admin/login" });
  }, [isLoggedIn, navigate]);

  const profiles = useMemo(() => aggregatePlayerProfiles(), []);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-6 space-y-5">
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

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-foreground">
              Player Profiles
            </h1>
            <p className="text-sm text-muted-foreground">
              Aggregated stats from all local sessions
            </p>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div
            data-ocid="players.empty_state"
            className="text-center py-16 space-y-3"
          >
            <div className="w-16 h-16 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-semibold">No player data yet</p>
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
            <div className="px-3 py-2 bg-muted/30 border-b border-border/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {profiles.length} Player{profiles.length !== 1 ? "s" : ""} —
                sorted by total runs
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20 bg-muted/20">
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                      Player
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
                      key={profile.name}
                      data-ocid={`players.item.${i + 1}`}
                      className="border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {profile.name}
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

        <div className="rounded-xl border border-noball-orange/30 bg-noball-orange/5 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-noball-orange mb-1">Note</p>
          Player stats are aggregated from local scoring sessions stored in your
          browser. Clearing browser data will reset these profiles. Player names
          are shown as IDs since the full match data is not available in the
          local session.
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
