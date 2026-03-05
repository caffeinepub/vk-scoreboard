import type { Innings, Match, Team } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { QRCodeModal } from "@/components/QRCodeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMatch } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useParams } from "@tanstack/react-router";
import {
  Activity,
  Printer,
  QrCode,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

// ─── Score Header ─────────────────────────────────────────────────────────────

function ScoreHeader({
  innings,
  team,
  isLive,
  target,
  maxOvers,
}: {
  innings: Innings;
  team: Team | undefined;
  isLive: boolean;
  target?: number;
  maxOvers?: number;
}) {
  const rr = calcRunRate(innings.totalRuns, innings.legalBalls);
  const totalAvailableBalls = maxOvers ? maxOvers * 6 : null;
  const ballsUsed = Number(innings.legalBalls);
  const ballsRemaining = totalAvailableBalls
    ? totalAvailableBalls - ballsUsed
    : null;

  const rrq =
    target && innings.legalBalls > 0n && ballsRemaining && ballsRemaining > 0
      ? (
          (target - Number(innings.totalRuns)) / (ballsRemaining / 6) || 0
        ).toFixed(2)
      : null;

  const runsNeeded = target
    ? Math.max(0, target - Number(innings.totalRuns))
    : null;

  const extras =
    Number(innings.wides) +
    Number(innings.noBalls) +
    Number(innings.byes) +
    Number(innings.legByes);

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
            {formatOvers(innings.legalBalls)} ov
            {maxOvers ? ` / ${maxOvers}` : ""}
          </div>
        </div>

        <div className="text-right space-y-1">
          {extras > 0 && (
            <div className="text-xs text-muted-foreground">
              Extras: {extras}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            W:{innings.wides.toString()} NB:{innings.noBalls.toString()} B:
            {innings.byes.toString()} LB:{innings.legByes.toString()}
          </div>
          {runsNeeded === 0 && (
            <div className="text-xs font-semibold text-neon-green">
              Target reached!
            </div>
          )}
          {rrq && <div className="text-xs text-electric-blue">RRQ: {rrq}</div>}
        </div>
      </div>

      {/* Prominent chase banner — full width below the score */}
      {runsNeeded !== null && runsNeeded > 0 && (
        <div className="mx-0 px-4 py-3 border-t border-cricket-gold/30 bg-cricket-gold/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cricket-gold shrink-0" />
            <span className="text-cricket-gold font-bold text-base leading-tight">
              Need{" "}
              <span className="text-2xl font-black tabular-nums">
                {runsNeeded}
              </span>{" "}
              runs
              {ballsRemaining !== null && ballsRemaining > 0 && (
                <>
                  {" "}
                  from{" "}
                  <span className="text-2xl font-black tabular-nums">
                    {ballsRemaining}
                  </span>{" "}
                  ball{ballsRemaining === 1 ? "" : "s"}
                </>
              )}
            </span>
          </div>
          {rrq && (
            <div className="text-xs text-muted-foreground font-mono shrink-0">
              RRQ: {rrq}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Innings Score Card (simple — no per-player data in backend Innings type) ──

function InningsScoreCard({
  innings,
  team,
  label,
}: {
  innings: Innings;
  team: Team | undefined;
  label: string;
}) {
  const extras =
    Number(innings.wides) +
    Number(innings.noBalls) +
    Number(innings.byes) +
    Number(innings.legByes);

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      <div className="px-3 py-2 bg-muted/30 border-b border-border/20 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          {team?.name ?? (innings.isFirstInnings ? "Team 1" : "Team 2")}
        </span>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-score font-black text-2xl text-foreground">
            {innings.totalRuns.toString()}/{innings.wickets.toString()}
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-0.5">
            {formatOvers(innings.legalBalls)} overs
            {extras > 0 && ` · Extras: ${extras}`}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          <div>CRR: {calcRunRate(innings.totalRuns, innings.legalBalls)}</div>
          {innings.result && (
            <div className="text-neon-green font-semibold text-xs mt-1">
              {innings.result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PublicScoreboardPage() {
  const { id } = useParams({ from: "/match/$id" });
  const matchId = BigInt(id);

  // Poll every 3000ms when match is live
  const { data: match, isLoading, isError } = useGetMatch(matchId, 3_000);
  const [qrOpen, setQrOpen] = useState(false);

  const handleShare = () => {
    const link = `${window.location.origin}/match/${id}`;
    navigator.clipboard.writeText(link).then(
      () => toast.success("Link copied!"),
      () => toast.error("Failed to copy link"),
    );
  };

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
  const maxOvers = match.maxOvers ? Number(match.maxOvers) : undefined;
  const isLive = match.status === "live";

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader />

      <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-4 pb-8 space-y-4">
        {/* Match name + status + share */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg text-foreground truncate">
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
              {maxOvers && (
                <span className="ml-2 text-muted-foreground/70">
                  · {maxOvers} overs
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLive && (
              <Badge className="bg-wicket-red/20 text-wicket-red border-wicket-red/40 gap-1.5">
                <span className="w-2 h-2 rounded-full bg-wicket-red live-pulse inline-block" />
                LIVE
              </Badge>
            )}
            {match.status === "completed" && (
              <Badge className="bg-neon-green/10 text-neon-green border-neon-green/20">
                Completed
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 border-border/60 text-muted-foreground hover:text-foreground"
              onClick={() => setQrOpen(true)}
              data-ocid="scoreboard.qr.button"
              title="QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 border-border/60 text-muted-foreground hover:text-foreground"
              onClick={() => window.print()}
              data-ocid="scoreboard.print.button"
              title="Print / Export PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-border/60 text-muted-foreground hover:text-foreground gap-1.5"
              onClick={handleShare}
              data-ocid="scoreboard.share.button"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Share</span>
            </Button>
          </div>
        </div>

        {/* Live indicator + Share */}
        {isLive && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex-1 flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2",
                "bg-wicket-red/10 border border-wicket-red/20 text-wicket-red/80",
              )}
            >
              <span className="w-2 h-2 rounded-full bg-wicket-red live-pulse inline-block" />
              LIVE — Updates every few seconds
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 border-primary/40 text-primary hover:bg-primary/10 gap-1.5 font-semibold shrink-0"
              onClick={handleShare}
              data-ocid="scoreboard.share_live.button"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Live
            </Button>
          </div>
        )}

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
              isLive={isLive && !innings2}
              maxOvers={maxOvers}
            />
            <InningsScoreCard
              innings={innings1}
              team={battingTeam1}
              label="1st Innings Summary"
            />
          </section>
        )}

        {/* 2nd Innings */}
        {innings2 && (
          <section className="space-y-3 mt-4 pt-4 border-t border-border/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2nd Innings
            </h2>

            {/* Target banner */}
            {target !== undefined && (
              <div className="rounded-xl border border-electric-blue/30 bg-electric-blue/10 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-electric-blue shrink-0" />
                  <span className="text-electric-blue font-semibold text-sm">
                    Target: <span className="font-black text-lg">{target}</span>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {battingTeam2?.name} batting
                </span>
              </div>
            )}

            <ScoreHeader
              innings={innings2}
              team={battingTeam2}
              isLive={isLive}
              target={target}
              maxOvers={maxOvers}
            />
            <InningsScoreCard
              innings={innings2}
              team={battingTeam2}
              label="2nd Innings Summary"
            />
          </section>
        )}

        {/* Teams overview */}
        {match.teams.length > 0 && (
          <section className="mt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Teams
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {match.teams.map((team) => (
                <div
                  key={team.id.toString()}
                  className="rounded-xl border border-border/40 bg-card p-3"
                >
                  <div className="font-semibold text-sm text-foreground mb-1 truncate">
                    {team.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {team.players.length} player
                    {team.players.length !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <AppFooter />

      <QRCodeModal
        url={`${typeof window !== "undefined" ? window.location.origin : ""}/match/${id}`}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
}
