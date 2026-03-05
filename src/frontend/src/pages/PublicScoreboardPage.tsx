import type { Innings, Match, Player, Team } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMatch } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useParams } from "@tanstack/react-router";
import { Activity, Target, TrendingUp } from "lucide-react";

function getPlayer(teams: Team[], id: bigint): Player | undefined {
  for (const t of teams) {
    const p = t.players.find((p) => p.id === id);
    if (p) return p;
  }
}

function getTeam(teams: Team[], id: bigint): Team | undefined {
  return teams.find((t) => t.id === id);
}

function formatOvers(legalBalls: bigint): string {
  const balls = Number(legalBalls);
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function calcRunRate(runs: bigint, legalBalls: bigint): string {
  const b = Number(legalBalls);
  if (b === 0) return "0.00";
  return ((Number(runs) / b) * 6).toFixed(2);
}

function calcStrikeRate(runs: bigint, balls: bigint): string {
  if (Number(balls) === 0) return "0.00";
  return ((Number(runs) / Number(balls)) * 100).toFixed(1);
}

// ─── Score Header ─────────────────────────────────────────────────────────────

function ScoreHeader({
  innings,
  team,
  isLive,
  target,
}: {
  innings: Innings;
  team: Team | undefined;
  isLive: boolean;
  target?: number;
}) {
  const rr = calcRunRate(innings.totalRuns, innings.totalBalls);
  const rrq =
    target && innings.totalBalls > 0n
      ? (
          (target - Number(innings.totalRuns)) /
            ((120 - Number(innings.totalBalls)) / 6) || 0
        ).toFixed(2)
      : null;

  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
      {/* Team name bar */}
      <div className="px-4 py-2 bg-muted/40 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm text-foreground">
            {team?.name ?? "Batting Team"}
          </span>
          {isLive && (
            <Badge className="bg-wicket-red/20 text-wicket-red border-wicket-red/40 text-xs gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-wicket-red live-pulse inline-block" />
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="w-3 h-3" />
          <span>CRR: {rr}</span>
        </div>
      </div>

      {/* Big score */}
      <div className="px-4 py-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-score font-black text-4xl sm:text-5xl text-foreground glow-green leading-none">
            {innings.totalRuns.toString()}/{innings.wickets.toString()}
          </div>
          <div className="text-muted-foreground text-sm mt-1 font-mono">
            {formatOvers(innings.totalBalls)} ov
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="text-xs text-muted-foreground">
            Extras: {innings.extras.toString()}
          </div>
          <div className="text-xs text-muted-foreground">
            W:{innings.wides.toString()} NB:{innings.noBalls.toString()} B:
            {innings.byes.toString()} LB:{innings.legByes.toString()}
          </div>
          {target && (
            <div className="text-xs font-semibold text-neon-green">
              Need {target - Number(innings.totalRuns)} off{" "}
              {120 - Number(innings.totalBalls)} balls
            </div>
          )}
          {rrq && <div className="text-xs text-electric-blue">RRQ: {rrq}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Current Batsmen ─────────────────────────────────────────────────────────

function CurrentBatsmen({
  innings,
  teams,
}: { innings: Innings; teams: Team[] }) {
  const striker = getPlayer(teams, innings.strikerId);
  const nonStriker = getPlayer(teams, innings.nonStrikerId);

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
      <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Batting
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/20 text-muted-foreground">
              <th className="text-left px-3 py-1.5 font-medium">Batsman</th>
              <th className="text-right px-2 py-1.5 font-medium">R</th>
              <th className="text-right px-2 py-1.5 font-medium">B</th>
              <th className="text-right px-2 py-1.5 font-medium">4s</th>
              <th className="text-right px-2 py-1.5 font-medium">6s</th>
              <th className="text-right px-2 py-1.5 font-medium">SR</th>
            </tr>
          </thead>
          <tbody>
            {striker && (
              <tr className="border-b border-border/10">
                <td className="px-3 py-2 font-semibold text-foreground">
                  <span className="text-primary mr-1">*</span>
                  {striker.name}
                </td>
                <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                  {striker.battingStats.runs.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                  {striker.battingStats.ballsFaced.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-neon-green">
                  {striker.battingStats.fours.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-cricket-gold">
                  {striker.battingStats.sixes.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                  {calcStrikeRate(
                    striker.battingStats.runs,
                    striker.battingStats.ballsFaced,
                  )}
                </td>
              </tr>
            )}
            {nonStriker && nonStriker.id !== striker?.id && (
              <tr>
                <td className="px-3 py-2 text-foreground/80">
                  {nonStriker.name}
                </td>
                <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                  {nonStriker.battingStats.runs.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                  {nonStriker.battingStats.ballsFaced.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-neon-green">
                  {nonStriker.battingStats.fours.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-cricket-gold">
                  {nonStriker.battingStats.sixes.toString()}
                </td>
                <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                  {calcStrikeRate(
                    nonStriker.battingStats.runs,
                    nonStriker.battingStats.ballsFaced,
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Current Bowler ──────────────────────────────────────────────────────────

function CurrentBowler({
  innings,
  teams,
}: { innings: Innings; teams: Team[] }) {
  const bowler = getPlayer(teams, innings.currentBowlerId);
  if (!bowler) return null;

  const eco =
    Number(bowler.bowlingStats.overs) > 0
      ? (
          Number(bowler.bowlingStats.runs) / Number(bowler.bowlingStats.overs)
        ).toFixed(2)
      : "0.00";

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
      <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bowling
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/20 text-muted-foreground">
              <th className="text-left px-3 py-1.5 font-medium">Bowler</th>
              <th className="text-right px-2 py-1.5 font-medium">O</th>
              <th className="text-right px-2 py-1.5 font-medium">M</th>
              <th className="text-right px-2 py-1.5 font-medium">R</th>
              <th className="text-right px-2 py-1.5 font-medium">W</th>
              <th className="text-right px-2 py-1.5 font-medium">Eco</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 font-semibold text-primary">
                {bowler.name} *
              </td>
              <td className="text-right px-2 py-2 font-mono">
                {bowler.bowlingStats.overs.toString()}
              </td>
              <td className="text-right px-2 py-2 font-mono">
                {bowler.bowlingStats.maidens.toString()}
              </td>
              <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                {bowler.bowlingStats.runs.toString()}
              </td>
              <td className="text-right px-2 py-2 font-mono font-bold text-wicket-red">
                {bowler.bowlingStats.wickets.toString()}
              </td>
              <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                {eco}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Last 6 balls ─────────────────────────────────────────────────────────────

function RecentBalls({ innings }: { innings: Innings }) {
  // Get last 6 balls from the current over (or recent)
  const allBalls = innings.balls;
  const recent = allBalls.slice(-6);

  if (recent.length === 0) return null;

  const getBallLabel = (ball: (typeof allBalls)[0]) => {
    if (ball.isWicket)
      return {
        label: "W",
        cls: "bg-wicket-red/20 border-wicket-red/60 text-wicket-red",
      };
    const et = ball.extrasType as string;
    if (et === "wide")
      return {
        label: "Wd",
        cls: "bg-wide-purple/20 border-wide-purple/50 text-wide-purple",
      };
    if (et === "noball")
      return {
        label: "NB",
        cls: "bg-noball-orange/20 border-noball-orange/50 text-noball-orange",
      };
    if (ball.runs === 6n)
      return {
        label: "6",
        cls: "bg-cricket-gold/20 border-cricket-gold/60 text-cricket-gold",
      };
    if (ball.runs === 4n)
      return {
        label: "4",
        cls: "bg-neon-green/20 border-neon-green/60 text-neon-green",
      };
    if (ball.runs === 0n)
      return {
        label: "·",
        cls: "bg-muted/60 border-border/50 text-muted-foreground",
      };
    return {
      label: ball.runs.toString(),
      cls: "bg-secondary border-border text-foreground",
    };
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1">This over:</span>
      {recent.map((ball, i) => {
        const { label, cls } = getBallLabel(ball);
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: recent balls array is a sliding window, index is stable display order
            key={i}
            className={cn("ball-dot border text-[10px] font-bold", cls)}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Scorecard Tabs ───────────────────────────────────────────────────────────

function ScorecardTabs({
  innings,
  teams,
}: { innings: Innings; teams: Team[] }) {
  const battingTeam = getTeam(teams, innings.battingTeamId);
  const bowlingTeam = getTeam(teams, innings.bowlingTeamId);

  const batters = battingTeam?.players ?? [];
  const bowlers =
    bowlingTeam?.players.filter(
      (p) =>
        Number(p.bowlingStats.overs) > 0 || Number(p.bowlingStats.runs) > 0,
    ) ?? [];

  return (
    <Tabs defaultValue="batting">
      <TabsList className="grid w-full grid-cols-2 bg-muted/50">
        <TabsTrigger value="batting" data-ocid="scorecard.batting.tab">
          Batting
        </TabsTrigger>
        <TabsTrigger value="bowling" data-ocid="scorecard.bowling.tab">
          Bowling
        </TabsTrigger>
      </TabsList>

      <TabsContent value="batting" className="mt-3">
        <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground bg-muted/30">
                  <th className="text-left px-3 py-2 font-medium">Batsman</th>
                  <th className="text-right px-2 py-2 font-medium">R</th>
                  <th className="text-right px-2 py-2 font-medium">B</th>
                  <th className="text-right px-2 py-2 font-medium">4s</th>
                  <th className="text-right px-2 py-2 font-medium">6s</th>
                  <th className="text-right px-2 py-2 font-medium">SR</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((p) => (
                  <tr
                    key={p.id.toString()}
                    className="border-b border-border/10"
                  >
                    <td className="px-3 py-2">
                      <div className="font-semibold text-foreground">
                        {p.name}
                      </div>
                      {p.battingStats.isOut && (
                        <div className="text-[10px] text-muted-foreground/60">
                          out
                        </div>
                      )}
                    </td>
                    <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                      {p.battingStats.runs.toString()}
                    </td>
                    <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                      {p.battingStats.ballsFaced.toString()}
                    </td>
                    <td className="text-right px-2 py-2 font-mono text-neon-green">
                      {p.battingStats.fours.toString()}
                    </td>
                    <td className="text-right px-2 py-2 font-mono text-cricket-gold">
                      {p.battingStats.sixes.toString()}
                    </td>
                    <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                      {calcStrikeRate(
                        p.battingStats.runs,
                        p.battingStats.ballsFaced,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fall of wickets */}
        {innings.wicketsFallen.length > 0 && (
          <div className="mt-3 rounded-xl border border-border/40 bg-card p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Fall of Wickets
            </div>
            <div className="flex flex-wrap gap-1.5">
              {innings.wicketsFallen.map((fow, i) => {
                const batsman = getPlayer(teams, fow.batsmanId);
                return (
                  <span
                    key={`fow-${fow.score.toString()}-${fow.ball.toString()}`}
                    className="text-xs bg-muted rounded px-2 py-0.5 font-mono text-foreground"
                  >
                    {fow.score.toString()}/{i + 1}
                    {batsman && (
                      <span className="text-muted-foreground ml-1">
                        ({batsman.name})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="bowling" className="mt-3">
        <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground bg-muted/30">
                  <th className="text-left px-3 py-2 font-medium">Bowler</th>
                  <th className="text-right px-2 py-2 font-medium">O</th>
                  <th className="text-right px-2 py-2 font-medium">M</th>
                  <th className="text-right px-2 py-2 font-medium">R</th>
                  <th className="text-right px-2 py-2 font-medium">W</th>
                  <th className="text-right px-2 py-2 font-medium">Eco</th>
                </tr>
              </thead>
              <tbody>
                {bowlers.map((p) => {
                  const eco =
                    Number(p.bowlingStats.overs) > 0
                      ? (
                          Number(p.bowlingStats.runs) /
                          Number(p.bowlingStats.overs)
                        ).toFixed(2)
                      : "-";
                  return (
                    <tr
                      key={p.id.toString()}
                      className="border-b border-border/10"
                    >
                      <td className="px-3 py-2 font-semibold text-foreground">
                        {p.name}
                      </td>
                      <td className="text-right px-2 py-2 font-mono">
                        {p.bowlingStats.overs.toString()}
                      </td>
                      <td className="text-right px-2 py-2 font-mono">
                        {p.bowlingStats.maidens.toString()}
                      </td>
                      <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                        {p.bowlingStats.runs.toString()}
                      </td>
                      <td className="text-right px-2 py-2 font-mono font-bold text-wicket-red">
                        {p.bowlingStats.wickets.toString()}
                      </td>
                      <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                        {eco}
                      </td>
                    </tr>
                  );
                })}
                {bowlers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-muted-foreground/60 text-xs"
                    >
                      No bowling data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PublicScoreboardPage() {
  const { id } = useParams({ from: "/match/$id" });
  const matchId = BigInt(id);

  const { data: match, isLoading, isError } = useGetMatch(matchId, 5_000);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-6 space-y-4">
          <Skeleton
            className="h-32 rounded-2xl shimmer"
            data-ocid="scoreboard.loading_state"
          />
          <Skeleton className="h-24 rounded-xl shimmer" />
          <Skeleton className="h-20 rounded-xl shimmer" />
        </main>
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div
            data-ocid="scoreboard.error_state"
            className="text-center space-y-2"
          >
            <p className="text-foreground font-semibold">Match not found</p>
            <p className="text-sm text-muted-foreground">
              This match may not exist or has been removed.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const innings1 = match.innings[0];
  const innings2 = match.innings[1];
  const battingTeam1 = innings1
    ? getTeam(match.teams, innings1.battingTeamId)
    : undefined;
  const battingTeam2 = innings2
    ? getTeam(match.teams, innings2.battingTeamId)
    : undefined;
  const target = innings1 ? Number(innings1.totalRuns) + 1 : undefined;

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader />

      <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-4 pb-8 space-y-4">
        {/* Match name + status */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">
              {match.name}
            </h1>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(Number(match.date) / 1_000_000).toLocaleDateString(
                "en-IN",
                {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                },
              )}
            </div>
          </div>
          {match.status === "live" && (
            <Badge className="bg-wicket-red/20 text-wicket-red border-wicket-red/40 gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-wicket-red live-pulse inline-block" />
              LIVE
            </Badge>
          )}
          {match.status === "completed" && (
            <Badge className="bg-neon-green/10 text-neon-green border-neon-green/20 shrink-0">
              Completed
            </Badge>
          )}
        </div>

        {/* Result */}
        {match.result && (
          <div className="flex items-center gap-2 text-sm font-semibold text-neon-green bg-neon-green/10 rounded-lg px-3 py-2 border border-neon-green/20">
            <Target className="w-4 h-4 shrink-0" />
            {match.result}
          </div>
        )}

        {/* No innings yet */}
        {match.innings.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">Match hasn't started yet</p>
          </div>
        )}

        {/* 1st Innings */}
        {innings1 && (
          <section className="space-y-3">
            {innings2 && (
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1st Innings
              </h2>
            )}
            <ScoreHeader
              innings={innings1}
              team={battingTeam1}
              isLive={match.status === "live" && !innings2}
            />
            <RecentBalls innings={innings1} />
            {innings1.status === "active" && (
              <>
                <CurrentBatsmen innings={innings1} teams={match.teams} />
                <CurrentBowler innings={innings1} teams={match.teams} />
              </>
            )}
            <ScorecardTabs innings={innings1} teams={match.teams} />
          </section>
        )}

        {/* 2nd Innings */}
        {innings2 && (
          <section className="space-y-3 mt-4 pt-4 border-t border-border/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2nd Innings
            </h2>
            <ScoreHeader
              innings={innings2}
              team={battingTeam2}
              isLive={match.status === "live"}
              target={target}
            />
            <RecentBalls innings={innings2} />
            {innings2.status === "active" && (
              <>
                <CurrentBatsmen innings={innings2} teams={match.teams} />
                <CurrentBowler innings={innings2} teams={match.teams} />
              </>
            )}
            <ScorecardTabs innings={innings2} teams={match.teams} />
          </section>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
