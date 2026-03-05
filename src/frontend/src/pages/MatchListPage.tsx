import type { Match, MatchStatus } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListMatches } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, Calendar, ChevronRight, Trophy, Users } from "lucide-react";

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === "live") {
    return (
      <Badge className="bg-wicket-red/20 text-wicket-red border-wicket-red/40 gap-1.5">
        <span className="w-2 h-2 rounded-full bg-wicket-red live-pulse inline-block" />
        LIVE
      </Badge>
    );
  }
  if (status === "completed") {
    return (
      <Badge className="bg-neon-green/10 text-neon-green/80 border-neon-green/20">
        Completed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground border-border/50">
      Setup
    </Badge>
  );
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  const navigate = useNavigate();
  const team1 = match.teams[0];
  const team2 = match.teams[1];

  const innings1 = match.innings[0];
  const innings2 = match.innings[1];

  const formatDate = (ts: bigint) => {
    const d = new Date(Number(ts) / 1_000_000);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const oversStr = (inn: typeof innings1) => {
    if (!inn) return "";
    const totalLegal =
      Number(inn.totalBalls) - Number(inn.wides) - Number(inn.noBalls);
    return `${Math.floor(totalLegal / 6)}.${totalLegal % 6}`;
  };

  const scoreDisplay = innings1
    ? `${innings1.totalRuns}/${innings1.wickets} (${oversStr(innings1)} ov)`
    : null;

  const score2Display = innings2
    ? `${innings2.totalRuns}/${innings2.wickets} (${oversStr(innings2)} ov)`
    : null;

  return (
    <button
      type="button"
      data-ocid={`matches.item.${index}`}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all duration-300 cursor-pointer animate-slide-up w-full text-left",
        match.status === "live" &&
          "border-wicket-red/30 hover:border-wicket-red/50",
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() =>
        void navigate({ to: "/match/$id", params: { id: match.id.toString() } })
      }
    >
      {/* Glow background for live matches */}
      {match.status === "live" && (
        <div className="absolute inset-0 bg-gradient-to-br from-wicket-red/5 to-transparent pointer-events-none" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display font-semibold text-foreground text-base leading-tight">
              {match.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(match.date)}</span>
              {match.maxOvers && (
                <>
                  <span className="text-border">·</span>
                  <span>{match.maxOvers.toString()} overs</span>
                </>
              )}
            </div>
          </div>
          <StatusBadge status={match.status} />
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {team1 ? (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    getTeamColorClass(team1.color),
                  )}
                />
                <span className="font-semibold text-sm text-foreground truncate">
                  {team1.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{team1.players.length}</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground/60 italic">
                Team 1 TBD
              </span>
            )}
            {scoreDisplay && (
              <div className="font-mono text-sm font-bold text-foreground mt-0.5 ml-4">
                {scoreDisplay}
              </div>
            )}
          </div>

          <div className="text-muted-foreground/40 font-bold text-xs shrink-0">
            VS
          </div>

          <div className="flex-1 min-w-0 text-right">
            {team2 ? (
              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{team2.players.length}</span>
                </div>
                <span className="font-semibold text-sm text-foreground truncate">
                  {team2.name}
                </span>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    getTeamColorClass(team2.color),
                  )}
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground/60 italic">
                Team 2 TBD
              </span>
            )}
            {score2Display && (
              <div className="font-mono text-sm font-bold text-foreground mt-0.5 mr-4">
                {score2Display}
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {match.result && (
          <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-1.5 text-xs text-neon-green">
            <Trophy className="w-3 h-3" />
            <span>{match.result}</span>
          </div>
        )}

        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-primary" />
        </div>
      </div>
    </button>
  );
}

function getTeamColorClass(color: string): string {
  const map: Record<string, string> = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    black: "bg-gray-800 border border-gray-600",
    white: "bg-white",
    yellow: "bg-yellow-400",
  };
  return map[color] ?? "bg-muted";
}

export function MatchListPage() {
  const { data: matches, isLoading, isError } = useListMatches();

  const liveMatches = matches?.filter((m) => m.status === "live") ?? [];
  const otherMatches = matches?.filter((m) => m.status !== "live") ?? [];

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2 py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Live Scoring
            </span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground tracking-tight">
            VK <span className="text-primary glow-green">Scoreboard</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Live ball-by-ball scoring for your local cricket matches. Every run,
            every wicket, in real time.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div data-ocid="matches.loading_state" className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable identity
              <Skeleton key={i} className="h-28 rounded-xl shimmer" />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div
            data-ocid="matches.error_state"
            className="text-center py-10 text-muted-foreground"
          >
            <p>Failed to load matches. Please refresh.</p>
          </div>
        )}

        {/* Live matches */}
        {!isLoading && liveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-wicket-red live-pulse" />
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-wicket-red">
                Live Now
              </h2>
            </div>
            <div className="space-y-3">
              {liveMatches.map((match, i) => (
                <MatchCard
                  key={match.id.toString()}
                  match={match}
                  index={i + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* Other matches */}
        {!isLoading && (
          <section>
            {liveMatches.length > 0 && (
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                All Matches
              </h2>
            )}
            {otherMatches.length > 0 ? (
              <div className="space-y-3">
                {otherMatches.map((match, i) => (
                  <MatchCard
                    key={match.id.toString()}
                    match={match}
                    index={i + 1}
                  />
                ))}
              </div>
            ) : (
              !isLoading &&
              liveMatches.length === 0 && (
                <div
                  data-ocid="matches.empty_state"
                  className="text-center py-16 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto">
                    <Activity className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">
                      No matches yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Log in as admin to create the first match
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10"
                    data-ocid="matches.admin_login.button"
                  >
                    <Link to="/admin/login">Admin Login</Link>
                  </Button>
                </div>
              )
            )}
          </section>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
