import type { Match, Player } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { BallPill } from "@/components/BallPill";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { DismissalType, ExtrasType } from "@/hooks/useCricketScoring";
import type { BallEvent } from "@/hooks/useCricketScoring";
import {
  type AutoCloseReason,
  type InningsState,
  clearSession,
  loadSession,
  saveSession,
  useCricketScoring,
} from "@/hooks/useCricketScoring";
import {
  useGetMatch,
  useRematch,
  useSaveInningsResult,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  Edit2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Share2,
  StopCircle,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlayer(match: Match, id: number): Player | undefined {
  for (const t of match.teams) {
    const p = t.players.find((p) => Number(p.id) === id);
    if (p) return p;
  }
}

function formatSR(runs: number, balls: number): string {
  if (balls === 0) return "-";
  return ((runs / balls) * 100).toFixed(0);
}

// ─── Wicket Dialog ─────────────────────────────────────────────────────────────

interface WicketDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    dismissalType: DismissalType,
    fielderId?: number,
    runs?: number,
  ) => void;
  match: Match;
  strikerId: number | null;
  bowlingTeamPlayers: Player[];
}

function WicketDialog({
  open,
  onClose,
  onConfirm,
  bowlingTeamPlayers,
}: WicketDialogProps) {
  const [dismissalType, setDismissalType] = useState<DismissalType>(
    DismissalType.bowled,
  );
  const [fielderId, setFielderId] = useState<string>("");
  const [runsBeforeWicket, setRunsBeforeWicket] = useState("0");

  const handleConfirm = () => {
    const fId = fielderId ? Number.parseInt(fielderId) : undefined;
    const runs = Number.parseInt(runsBeforeWicket) || 0;
    onConfirm(dismissalType, fId, runs);
  };

  const showFielder =
    dismissalType === DismissalType.caught ||
    dismissalType === DismissalType.runout ||
    dismissalType === DismissalType.stumping;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="wicket.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-wicket-red flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Wicket!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dismissal type */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Dismissal Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.values(DismissalType) as DismissalType[]).map((dt) => (
                <button
                  type="button"
                  key={dt}
                  onClick={() => setDismissalType(dt)}
                  className={cn(
                    "h-10 rounded-lg border text-sm font-medium transition-all capitalize",
                    dismissalType === dt
                      ? "bg-wicket-red/20 border-wicket-red/60 text-wicket-red"
                      : "bg-muted/50 border-border/50 text-muted-foreground hover:border-border",
                  )}
                  data-ocid={`wicket.dismissal_type.${dt}.toggle`}
                >
                  {dt === "hitwicket"
                    ? "Hit Wicket"
                    : dt === "runout"
                      ? "Run Out"
                      : dt.charAt(0).toUpperCase() + dt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Fielder */}
          {showFielder && bowlingTeamPlayers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {dismissalType === DismissalType.caught
                  ? "Caught by"
                  : dismissalType === DismissalType.stumping
                    ? "Stumped by"
                    : "Run Out by"}{" "}
                (optional)
              </p>
              <Select value={fielderId} onValueChange={setFielderId}>
                <SelectTrigger
                  className="h-11 bg-input border-border/60"
                  data-ocid="wicket.fielder.select"
                >
                  <SelectValue placeholder="Select fielder" />
                </SelectTrigger>
                <SelectContent>
                  {bowlingTeamPlayers.map((p) => (
                    <SelectItem key={p.id.toString()} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Runs before wicket (run out) */}
          {dismissalType === DismissalType.runout && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Runs completed before runout
              </p>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRunsBeforeWicket(r.toString())}
                    className={cn(
                      "flex-1 h-10 rounded-lg border text-sm font-mono font-bold transition-all",
                      runsBeforeWicket === r.toString()
                        ? "bg-primary/20 border-primary/60 text-primary"
                        : "bg-muted/50 border-border/50 text-muted-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border/60"
            data-ocid="wicket.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-wicket-red/20 text-wicket-red border border-wicket-red/40 hover:bg-wicket-red/30 box-glow-red"
            data-ocid="wicket.confirm_button"
          >
            Confirm Wicket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Select Batsman Dialog ────────────────────────────────────────────────────

interface SelectBatsmanDialogProps {
  open: boolean;
  onSelect: (playerId: number) => void;
  availablePlayers: Player[];
}

function SelectBatsmanDialog({
  open,
  onSelect,
  availablePlayers,
}: SelectBatsmanDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="select_batsman.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Select Next Batsman
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {availablePlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No more batsmen available
            </p>
          ) : (
            availablePlayers.map((p) => (
              <button
                type="button"
                key={p.id.toString()}
                onClick={() => onSelect(Number(p.id))}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/40 hover:bg-primary/10 transition-all text-left"
                data-ocid="select_batsman.player.button"
              >
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono text-primary shrink-0">
                  {p.jerseyNumber.toString()}
                </span>
                <span className="font-semibold text-foreground">{p.name}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Select Bowler Dialog ─────────────────────────────────────────────────────

interface SelectBowlerDialogProps {
  open: boolean;
  onSelect: (playerId: number) => void;
  availablePlayers: Player[];
  currentBowlerId: number | null;
}

function SelectBowlerDialog({
  open,
  onSelect,
  availablePlayers,
  currentBowlerId,
}: SelectBowlerDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="select_bowler.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Select Next Bowler</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-1">
          The same bowler cannot bowl two consecutive overs
        </p>
        <div className="space-y-2 py-2">
          {availablePlayers
            .filter((p) => Number(p.id) !== currentBowlerId)
            .map((p) => (
              <button
                type="button"
                key={p.id.toString()}
                onClick={() => onSelect(Number(p.id))}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/40 hover:bg-primary/10 transition-all text-left"
                data-ocid="select_bowler.player.button"
              >
                <span className="w-8 h-8 rounded-full bg-electric-blue/20 flex items-center justify-center text-xs font-mono text-electric-blue shrink-0">
                  {p.jerseyNumber.toString()}
                </span>
                <span className="font-semibold text-foreground">{p.name}</span>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Over Progress ────────────────────────────────────────────────────────────

function OverProgress({
  balls,
  currentOverLegalBalls,
}: {
  balls: ReturnType<typeof useCricketScoring>["currentOverBalls"];
  currentOverLegalBalls: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1 shrink-0">Over:</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6].map((ballNum) => {
          const ball = balls.find(
            (b) => b.isLegalDelivery && b.ballNumber === ballNum,
          );
          const isCurrent = ballNum <= currentOverLegalBalls;

          if (ball) {
            return <BallPill key={`legal-${ballNum}`} ball={ball} size="sm" />;
          }
          return (
            <div
              key={`slot-${ballNum}`}
              className={cn(
                "w-7 h-7 rounded-full border-2 border-dashed transition-all",
                isCurrent ? "border-primary/50" : "border-border/30",
              )}
            />
          );
        })}
      </div>
      {/* Extra balls this over */}
      {balls
        .filter((b) => !b.isLegalDelivery)
        .map((b) => (
          <BallPill key={`extra-${b.totalBallIndex}`} ball={b} size="sm" />
        ))}
    </div>
  );
}

// ─── Scoring Buttons ──────────────────────────────────────────────────────────

interface ScoringButtonsProps {
  onRun: (n: number) => void;
  onWide: () => void;
  onNoBall: () => void;
  onBye: (n: number) => void;
  onLegBye: (n: number) => void;
  onWicket: () => void;
  onUndo: () => void;
  onEndInnings: () => void;
  isFreeHit: boolean;
  disabled: boolean;
}

function ScoringButtons({
  onRun,
  onWide,
  onNoBall,
  onBye,
  onLegBye,
  onWicket,
  onUndo,
  onEndInnings,
  isFreeHit,
  disabled,
}: ScoringButtonsProps) {
  const [showByes, setShowByes] = useState(false);
  const [byeType, setByeType] = useState<"bye" | "legbye">("bye");

  if (showByes) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {byeType === "bye" ? "Byes" : "Leg Byes"} — How many runs?
          </span>
          <button
            type="button"
            onClick={() => setShowByes(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
            data-ocid="scoring.back.button"
          >
            ← Back
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => {
                if (byeType === "bye") onBye(r);
                else onLegBye(r);
                setShowByes(false);
              }}
              disabled={disabled}
              className="score-btn rounded-xl border border-border/50 bg-muted/60 hover:border-primary/40 hover:bg-primary/10 transition-all font-mono font-bold text-lg text-foreground"
              data-ocid={`scoring.${byeType}_${r}.button`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Row 1: Run buttons */}
      <div className="grid grid-cols-6 gap-1.5">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            type="button"
            key={run}
            onClick={() => onRun(run)}
            disabled={disabled}
            className={cn(
              "score-btn rounded-xl border font-mono font-black text-xl transition-all active:scale-95",
              run === 6
                ? "bg-cricket-gold/20 border-cricket-gold/50 text-cricket-gold hover:bg-cricket-gold/30 box-glow-gold"
                : run === 4
                  ? "bg-neon-green/15 border-neon-green/40 text-neon-green hover:bg-neon-green/25 box-glow-green"
                  : run === 0
                    ? "bg-muted/50 border-border/40 text-muted-foreground hover:border-border"
                    : "bg-secondary border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/10",
            )}
            data-ocid={`scoring.run_${run}.button`}
          >
            {run}
          </button>
        ))}
      </div>

      {/* Row 2: Extras */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={onWide}
          disabled={disabled}
          className="score-btn rounded-xl border border-wide-purple/40 bg-wide-purple/10 text-wide-purple hover:bg-wide-purple/20 transition-all font-semibold text-sm active:scale-95"
          data-ocid="scoring.wide.button"
        >
          Wide
        </button>
        <button
          type="button"
          onClick={onNoBall}
          disabled={disabled}
          className="score-btn rounded-xl border border-noball-orange/40 bg-noball-orange/10 text-noball-orange hover:bg-noball-orange/20 transition-all font-semibold text-sm active:scale-95"
          data-ocid="scoring.noball.button"
        >
          No Ball
        </button>
        <button
          type="button"
          onClick={() => {
            setByeType("bye");
            setShowByes(true);
          }}
          disabled={disabled}
          className="score-btn rounded-xl border border-border/50 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground transition-all font-semibold text-sm active:scale-95"
          data-ocid="scoring.bye.button"
        >
          Bye
        </button>
        <button
          type="button"
          onClick={() => {
            setByeType("legbye");
            setShowByes(true);
          }}
          disabled={disabled}
          className="score-btn rounded-xl border border-border/50 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground transition-all font-semibold text-sm active:scale-95"
          data-ocid="scoring.legbye.button"
        >
          Leg Bye
        </button>
      </div>

      {/* Row 3: Wicket */}
      <button
        type="button"
        onClick={onWicket}
        disabled={disabled || isFreeHit}
        className={cn(
          "w-full score-btn rounded-xl border font-display font-black text-lg tracking-widest transition-all active:scale-95",
          isFreeHit
            ? "bg-cricket-gold/10 border-cricket-gold/40 text-cricket-gold/60 cursor-not-allowed"
            : "bg-wicket-red/15 border-wicket-red/50 text-wicket-red hover:bg-wicket-red/25 box-glow-red",
        )}
        data-ocid="scoring.wicket.button"
      >
        {isFreeHit ? "🛡 FREE HIT — No Wicket" : "⚡ WICKET"}
      </button>

      {/* Row 4: Undo */}
      <button
        type="button"
        onClick={onUndo}
        className="w-full h-10 rounded-lg border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border transition-all text-sm flex items-center justify-center gap-1.5"
        data-ocid="scoring.undo.button"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Undo Last Ball
      </button>

      {/* End Innings */}
      <button
        type="button"
        onClick={onEndInnings}
        className="w-full h-11 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all text-sm font-semibold flex items-center justify-center gap-2 active:scale-95"
        data-ocid="scoring.end_innings.button"
      >
        <StopCircle className="w-4 h-4" />
        End Innings
      </button>
    </div>
  );
}

// ─── End Innings Confirm Dialog ───────────────────────────────────────────────

interface EndInningsConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalRuns: number;
  wickets: number;
  oversString: string;
  inningsNumber: 1 | 2;
}

function EndInningsConfirmDialog({
  open,
  onClose,
  onConfirm,
  totalRuns,
  wickets,
  oversString,
  inningsNumber,
}: EndInningsConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="end_innings.dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display flex items-center gap-2">
            <StopCircle className="w-5 h-5 text-destructive" />
            End {inningsNumber === 1 ? "1st" : "2nd"} Innings?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Current score:{" "}
            <span className="font-mono font-bold text-foreground">
              {totalRuns}/{wickets}
            </span>{" "}
            in{" "}
            <span className="font-mono font-bold text-foreground">
              {oversString}
            </span>{" "}
            overs.
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-ocid="end_innings.cancel_button"
            onClick={onClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-ocid="end_innings.confirm_button"
            onClick={onConfirm}
            className="bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
          >
            End Innings
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Final Result Screen ──────────────────────────────────────────────────────

interface FinalResultScreenProps {
  match: Match;
  innings1: InningsState;
  innings2: InningsState;
  autoCloseReason: AutoCloseReason;
  maxOvers?: number;
  onNewMatch: () => void;
  onRematch: () => void;
  isRematching: boolean;
}

function buildResultText(
  match: Match,
  innings1: InningsState,
  innings2: InningsState,
  autoCloseReason: AutoCloseReason,
  maxOvers?: number,
): string {
  const team1 = match.teams[0];
  const team2 = match.teams[1];
  const t1Name = team1?.name ?? "Team 1";
  const t2Name = team2?.name ?? "Team 2";

  if (autoCloseReason === "target_reached") {
    // Team 2 won — calculate wickets remaining
    const wicketsRemaining =
      (match.teams[1]?.players.length ?? 11) - 1 - innings2.wickets;
    const ballsRemaining = maxOvers ? maxOvers * 6 - innings2.legalBalls : null;
    const ballsStr =
      ballsRemaining !== null && ballsRemaining > 0
        ? ` (${ballsRemaining} ball${ballsRemaining === 1 ? "" : "s"} remaining)`
        : "";
    if (wicketsRemaining > 0) {
      return `${t2Name} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? "" : "s"}${ballsStr}`;
    }
    return `${t2Name} won${ballsStr}`;
  }

  if (innings2.totalRuns > innings1.totalRuns) {
    const wicketsRemaining =
      (match.teams[1]?.players.length ?? 11) - 1 - innings2.wickets;
    if (wicketsRemaining > 0) {
      return `${t2Name} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? "" : "s"}`;
    }
    return `${t2Name} won`;
  }

  if (innings2.totalRuns === innings1.totalRuns) {
    return "Match Tied";
  }

  // Team 1 won
  const runMargin = innings1.totalRuns - innings2.totalRuns;
  return `${t1Name} won by ${runMargin} run${runMargin === 1 ? "" : "s"}`;
}

function FinalResultScreen({
  match,
  innings1,
  innings2,
  autoCloseReason,
  maxOvers,
  onNewMatch,
  onRematch,
  isRematching,
}: FinalResultScreenProps) {
  const team1 = match.teams[0];
  const team2 = match.teams[1];
  const resultText = buildResultText(
    match,
    innings1,
    innings2,
    autoCloseReason,
    maxOvers,
  );
  const target = innings1.totalRuns + 1;

  const inn1OversStr = `${innings1.currentOver}.${innings1.currentOverLegalBalls}`;
  const inn2OversStr = `${innings2.currentOver}.${innings2.currentOverLegalBalls}`;

  const isTeam2Won =
    autoCloseReason === "target_reached" ||
    innings2.totalRuns > innings1.totalRuns;
  const isTied =
    innings2.totalRuns === innings1.totalRuns &&
    autoCloseReason !== "target_reached";

  return (
    <div className="space-y-4 animate-fade-in" data-ocid="final_result.panel">
      {/* Winner banner */}
      <div className="rounded-2xl border border-cricket-gold/40 bg-gradient-to-b from-cricket-gold/10 to-transparent p-5 text-center space-y-3">
        <Trophy className="w-10 h-10 text-cricket-gold mx-auto" />
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Match Complete
        </div>
        <div className="font-display font-black text-2xl text-foreground leading-tight">
          {resultText}
        </div>
        {!isTied && (
          <div className="text-sm text-muted-foreground">
            {isTeam2Won ? team2?.name : team1?.name} wins!
          </div>
        )}
      </div>

      {/* Score comparison */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <div className="px-3 py-2 bg-muted/30 border-b border-border/20">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scorecard
          </span>
        </div>
        <div className="divide-y divide-border/20">
          {/* Team 1 */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-foreground">
                {team1?.name ?? "Team 1"}
              </div>
              <div className="text-xs text-muted-foreground">
                1st Innings · {inn1OversStr} ov · {innings1.wickets}W
              </div>
            </div>
            <div className="font-score font-black text-2xl text-foreground">
              {innings1.totalRuns}/{innings1.wickets}
            </div>
          </div>

          {/* Team 2 */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-foreground">
                {team2?.name ?? "Team 2"}
              </div>
              <div className="text-xs text-muted-foreground">
                2nd Innings · {inn2OversStr} ov · {innings2.wickets}W · Target{" "}
                {target}
              </div>
            </div>
            <div
              className={cn(
                "font-score font-black text-2xl",
                isTeam2Won
                  ? "text-neon-green glow-green"
                  : isTied
                    ? "text-cricket-gold"
                    : "text-foreground",
              )}
            >
              {innings2.totalRuns}/{innings2.wickets}
            </div>
          </div>
        </div>
      </div>

      {/* Batting summary - Team 1 */}
      <InningsBattingSummary
        label={`${team1?.name ?? "Team 1"} — Batting`}
        snapshot={innings1}
        team={team1}
      />

      {/* Batting summary - Team 2 */}
      <InningsBattingSummary
        label={`${team2?.name ?? "Team 2"} — Batting`}
        snapshot={innings2}
        team={team2}
      />

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onRematch}
          disabled={isRematching}
          className="flex-1 bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 font-bold box-glow-green"
          data-ocid="final_result.rematch.button"
        >
          {isRematching ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isRematching ? "Creating..." : "Rematch"}
        </Button>
        <Button
          onClick={onNewMatch}
          variant="outline"
          className="flex-1 border-border/50 text-muted-foreground"
          data-ocid="final_result.new_match.button"
        >
          Back to Matches
        </Button>
      </div>
    </div>
  );
}

function InningsBattingSummary({
  label,
  snapshot,
  team,
}: {
  label: string;
  snapshot: InningsState;
  team: Match["teams"][0] | undefined;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border/20 bg-muted/30">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/10">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                Batsman
              </th>
              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                R
              </th>
              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                B
              </th>
              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                4s
              </th>
              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                6s
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from(snapshot.batsmanStats.entries()).map(([id, stats]) => {
              const player = team?.players.find((p) => Number(p.id) === id);
              if (!player) return null;
              return (
                <tr
                  key={id}
                  className="border-b border-border/10 last:border-0"
                >
                  <td className="px-3 py-2 text-foreground">
                    {player.name}
                    {stats.isOut && stats.dismissalType && (
                      <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                        ({stats.dismissalType})
                      </span>
                    )}
                    {!stats.isOut && (
                      <span className="ml-1 text-primary text-xs">*</span>
                    )}
                  </td>
                  <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                    {stats.runs}
                  </td>
                  <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                    {stats.balls}
                  </td>
                  <td className="text-right px-2 py-2 font-mono text-neon-green">
                    {stats.fours}
                  </td>
                  <td className="text-right px-2 py-2 font-mono text-cricket-gold">
                    {stats.sixes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Innings Summary Screen ───────────────────────────────────────────────────

interface InningsSummaryScreenProps {
  match: Match;
  snapshot: InningsState;
  inningsNumber: 1 | 2;
  onStart2ndInnings?: () => void;
  innings1Snapshot?: InningsState | null;
  target?: number;
}

function InningsSummaryScreen({
  match,
  snapshot,
  inningsNumber,
  onStart2ndInnings,
  innings1Snapshot,
  target,
}: InningsSummaryScreenProps) {
  const battingTeamIndex = inningsNumber === 1 ? 0 : 1;
  const battingTeam = match.teams[battingTeamIndex];
  const oversPlayed = `${snapshot.currentOver}.${snapshot.currentOverLegalBalls}`;

  // Determine winner for 2nd innings summary (non-final)
  let matchResult = "";
  if (inningsNumber === 2 && innings1Snapshot) {
    if (snapshot.totalRuns > innings1Snapshot.totalRuns) {
      matchResult = `${battingTeam?.name ?? "Team 2"} won`;
    } else if (snapshot.totalRuns === innings1Snapshot.totalRuns) {
      matchResult = "Match Tied";
    } else {
      const team1 = match.teams[0];
      matchResult = `${team1?.name ?? "Team 1"} won by ${innings1Snapshot.totalRuns - snapshot.totalRuns} runs`;
    }
  }

  return (
    <div
      className="space-y-4 animate-fade-in"
      data-ocid="innings_summary.panel"
    >
      {/* Header */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 text-center space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {inningsNumber === 1 ? "1st Innings Complete" : "Match Complete"}
        </div>
        <div className="font-display font-bold text-2xl text-foreground">
          {battingTeam?.name}
        </div>
        <div className="font-score font-black text-5xl text-foreground glow-green">
          {snapshot.totalRuns}/{snapshot.wickets}
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {oversPlayed} overs · CRR{" "}
          {snapshot.legalBalls > 0
            ? (snapshot.totalRuns / (snapshot.legalBalls / 6)).toFixed(2)
            : "0.00"}
        </div>
        {inningsNumber === 1 && (
          <div className="mt-2 px-4 py-2 rounded-xl bg-electric-blue/10 border border-electric-blue/30 text-electric-blue font-bold text-sm">
            Target for {match.teams[1]?.name ?? "Team 2"}:{" "}
            {snapshot.totalRuns + 1}
          </div>
        )}
        {inningsNumber === 2 && matchResult && (
          <div className="mt-2 px-4 py-2 rounded-xl bg-cricket-gold/10 border border-cricket-gold/30 text-cricket-gold font-bold text-sm">
            {matchResult}
          </div>
        )}
      </div>

      {/* Target info for 2nd innings summary */}
      {inningsNumber === 2 && innings1Snapshot && target && (
        <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-2.5 text-center text-sm">
          <span className="text-muted-foreground">Target was: </span>
          <span className="font-mono font-bold text-electric-blue">
            {target}
          </span>
          <span className="text-muted-foreground"> · 1st Innings: </span>
          <span className="font-mono font-bold text-foreground">
            {innings1Snapshot.totalRuns}/{innings1Snapshot.wickets}
          </span>
          <span className="text-muted-foreground"> · 2nd Innings: </span>
          <span className="font-mono font-bold text-foreground">
            {snapshot.totalRuns}/{snapshot.wickets}
          </span>
        </div>
      )}

      {/* Batsman stats */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <div className="px-3 py-2 border-b border-border/20 bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Batting
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/10">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                  Batsman
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  R
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  B
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  4s
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  6s
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from(snapshot.batsmanStats.entries()).map(
                ([id, stats]) => {
                  const player = battingTeam?.players.find(
                    (p) => Number(p.id) === id,
                  );
                  if (!player) return null;
                  return (
                    <tr
                      key={id}
                      className="border-b border-border/10 last:border-0"
                    >
                      <td className="px-3 py-2 text-foreground">
                        {player.name}
                        {stats.isOut && stats.dismissalType && (
                          <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                            ({stats.dismissalType})
                          </span>
                        )}
                        {!stats.isOut && (
                          <span className="ml-1 text-primary text-xs">*</span>
                        )}
                      </td>
                      <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                        {stats.runs}
                      </td>
                      <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                        {stats.balls}
                      </td>
                      <td className="text-right px-2 py-2 font-mono text-neon-green">
                        {stats.fours}
                      </td>
                      <td className="text-right px-2 py-2 font-mono text-cricket-gold">
                        {stats.sixes}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bowler stats */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <div className="px-3 py-2 border-b border-border/20 bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bowling
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/10">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                  Bowler
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  O
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  M
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  R
                </th>
                <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                  W
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from(snapshot.bowlerStats.entries()).map(([id, stats]) => {
                const bowlingTeamIndex = inningsNumber === 1 ? 1 : 0;
                const bowlingTeam = match.teams[bowlingTeamIndex];
                const player = bowlingTeam?.players.find(
                  (p) => Number(p.id) === id,
                );
                if (!player) return null;
                return (
                  <tr
                    key={id}
                    className="border-b border-border/10 last:border-0"
                  >
                    <td className="px-3 py-2 font-semibold text-electric-blue">
                      {player.name}
                    </td>
                    <td className="text-right px-2 py-2 font-mono">
                      {stats.overs}.{stats.ballsThisOver}
                    </td>
                    <td className="text-right px-2 py-2 font-mono">
                      {stats.maidens}
                    </td>
                    <td className="text-right px-2 py-2 font-mono font-bold text-foreground">
                      {stats.runs}
                    </td>
                    <td className="text-right px-2 py-2 font-mono font-bold text-wicket-red">
                      {stats.wickets}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      {inningsNumber === 1 && onStart2ndInnings && (
        <Button
          onClick={onStart2ndInnings}
          className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base box-glow-green"
          data-ocid="innings_summary.start_2nd_innings.button"
        >
          <Activity className="w-5 h-5 mr-2" />
          Start 2nd Innings — Target: {snapshot.totalRuns + 1}
        </Button>
      )}
    </div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

interface SetupScreenProps {
  match: Match;
  onStart: (strikerId: number, nonStrikerId: number, bowlerId: number) => void;
  inningsNumber: 1 | 2;
  target?: number;
  maxOvers?: number;
}

function SetupScreen({
  match,
  onStart,
  inningsNumber,
  target,
  maxOvers,
}: SetupScreenProps) {
  // For innings 1: batting=team0, bowling=team1. For innings 2: swap.
  const battingTeamIndex = inningsNumber === 1 ? 0 : 1;
  const bowlingTeamIndex = inningsNumber === 1 ? 1 : 0;
  const battingTeam = match.teams[battingTeamIndex];
  const bowlingTeam = match.teams[bowlingTeamIndex];

  const [strikerId, setStrikerId] = useState<string>("");
  const [nonStrikerId, setNonStrikerId] = useState<string>("");
  const [bowlerId, setBowlerId] = useState<string>("");

  const canStart =
    strikerId && nonStrikerId && bowlerId && strikerId !== nonStrikerId;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-lg text-foreground">
          {inningsNumber === 1 ? "1st" : "2nd"} Innings Setup
        </h2>
        <p className="text-sm text-muted-foreground">
          {battingTeam?.name} batting · {bowlingTeam?.name} bowling
        </p>
        {maxOvers && (
          <p className="text-xs text-muted-foreground">
            {maxOvers} over{maxOvers === 1 ? "" : "s"} match
          </p>
        )}
      </div>

      {/* Target banner for 2nd innings */}
      {inningsNumber === 2 && target !== undefined && (
        <div className="rounded-2xl border border-electric-blue/40 bg-electric-blue/10 px-5 py-4 text-center space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-electric-blue/70">
            Target to win
          </div>
          <div className="font-score font-black text-5xl text-electric-blue">
            {target}
          </div>
          <div className="text-xs text-muted-foreground">
            {battingTeam?.name} needs {target} runs to win
            {maxOvers ? ` in ${maxOvers} over${maxOvers === 1 ? "" : "s"}` : ""}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-4">
        {/* Striker */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Opener 1 (Striker) *
          </p>
          <Select value={strikerId} onValueChange={setStrikerId}>
            <SelectTrigger
              className="h-12 bg-input border-border/60"
              data-ocid="setup.striker.select"
            >
              <SelectValue placeholder="Select striker..." />
            </SelectTrigger>
            <SelectContent>
              {battingTeam?.players.map((p) => (
                <SelectItem key={p.id.toString()} value={p.id.toString()}>
                  #{p.jerseyNumber.toString()} {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Non-striker */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Opener 2 (Non-Striker) *
          </p>
          <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
            <SelectTrigger
              className="h-12 bg-input border-border/60"
              data-ocid="setup.non_striker.select"
            >
              <SelectValue placeholder="Select non-striker..." />
            </SelectTrigger>
            <SelectContent>
              {battingTeam?.players
                .filter((p) => p.id.toString() !== strikerId)
                .map((p) => (
                  <SelectItem key={p.id.toString()} value={p.id.toString()}>
                    #{p.jerseyNumber.toString()} {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Opening bowler */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Opening Bowler *
          </p>
          <Select value={bowlerId} onValueChange={setBowlerId}>
            <SelectTrigger
              className="h-12 bg-input border-border/60"
              data-ocid="setup.bowler.select"
            >
              <SelectValue placeholder="Select bowler..." />
            </SelectTrigger>
            <SelectContent>
              {bowlingTeam?.players.map((p) => (
                <SelectItem key={p.id.toString()} value={p.id.toString()}>
                  #{p.jerseyNumber.toString()} {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          disabled={!canStart}
          onClick={() => {
            if (canStart) {
              onStart(
                Number.parseInt(strikerId),
                Number.parseInt(nonStrikerId),
                Number.parseInt(bowlerId),
              );
            }
          }}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base box-glow-green"
          data-ocid="setup.start_innings.button"
        >
          <Activity className="w-5 h-5 mr-2" />
          Start Innings
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LiveScoringPage() {
  const { id } = useParams({ from: "/admin/match/$id/score" });
  const matchId = BigInt(id);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: match, isLoading } = useGetMatch(matchId);

  const [inningsNumber, setInningsNumber] = useState<1 | 2>(1);
  const [innings1Snapshot, setInnings1Snapshot] = useState<InningsState | null>(
    null,
  );
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Derived match settings
  const maxOvers = match?.maxOvers ? Number(match.maxOvers) : undefined;

  // For 2nd innings, we pass the target
  const target =
    inningsNumber === 2 && innings1Snapshot
      ? innings1Snapshot.totalRuns + 1
      : undefined;

  // Total players in batting team (for all-out detection)
  const battingTeamIndex = inningsNumber === 1 ? 0 : 1;
  const battingTeam = match?.teams[battingTeamIndex];
  const totalPlayers = battingTeam?.players.length;

  const scoring = useCricketScoring({
    matchId: id,
    target,
    maxOvers,
    totalPlayers,
  });
  const {
    inningsState,
    currentRunRate,
    oversString,
    currentOverBalls,
    requiredRuns,
    requiredBalls,
  } = scoring;

  // ─── Session persistence ──────────────────────────────────────────────────

  // Load saved session on mount (after match data is available)
  // biome-ignore lint/correctness/useExhaustiveDependencies: scoring.dispatch is stable (useReducer dispatch)
  useEffect(() => {
    if (!match || sessionLoaded) return;
    const saved = loadSession(id);
    if (saved && saved.inningsState.status !== "not-started") {
      setInningsNumber(saved.inningsNumber);
      setInnings1Snapshot(saved.innings1Snapshot);
      // Restore innings state by replaying balls
      scoring.dispatch({ type: "RESET_INNINGS" });
      // We need to manually restore the state. Use a ref-based approach.
      restoredStateRef.current = saved.inningsState;
      setNeedsRestore(true);
    }
    setSessionLoaded(true);
  }, [match, sessionLoaded, id]);

  const restoredStateRef = useRef<InningsState | null>(null);
  const [needsRestore, setNeedsRestore] = useState(false);

  // After RESET_INNINGS triggered by restore, replay the saved balls
  // biome-ignore lint/correctness/useExhaustiveDependencies: scoring.dispatch is stable (useReducer dispatch)
  useEffect(() => {
    if (!needsRestore || !restoredStateRef.current) return;
    const saved = restoredStateRef.current;
    restoredStateRef.current = null;
    setNeedsRestore(false);

    if (saved.status === "not-started") return;

    // Start innings with the original players from saved balls
    if (saved.balls.length > 0) {
      const firstBall = saved.balls[0];
      scoring.dispatch({
        type: "START_INNINGS",
        strikerId: firstBall.strikerId,
        nonStrikerId: firstBall.nonStrikerId,
        bowlerId: firstBall.bowlerId,
      });
      // Replay all balls
      for (const ball of saved.balls) {
        let event: BallEvent;
        if (ball.isWicket) {
          event = {
            type: "WICKET",
            dismissalType: ball.dismissalType!,
            fielderId: ball.fielderId,
            runs: ball.runs,
          };
        } else if (ball.extrasType === ExtrasType.wide) {
          event = { type: "WIDE" };
        } else if (ball.extrasType === ExtrasType.noball) {
          event = { type: "NO_BALL", runs: ball.runs };
        } else if (ball.extrasType === ExtrasType.bye) {
          event = { type: "BYE", runs: ball.runs };
        } else if (ball.extrasType === ExtrasType.legbye) {
          event = { type: "LEG_BYE", runs: ball.runs };
        } else {
          event = { type: "RUNS", runs: ball.runs };
        }
        scoring.dispatch({ type: "RECORD_BALL", event });
      }
      // If innings was closed, close it
      if (saved.status === "closed") {
        scoring.dispatch({
          type: "CLOSE_INNINGS",
          reason: saved.autoCloseReason ?? "manual",
        });
      }
    } else if (saved.strikerId !== null) {
      // Started but no balls yet
      scoring.dispatch({
        type: "START_INNINGS",
        strikerId: saved.strikerId,
        nonStrikerId: saved.nonStrikerId!,
        bowlerId: saved.bowlerId!,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsRestore]);

  // Save session to localStorage whenever relevant state changes
  useEffect(() => {
    if (!sessionLoaded) return;
    if (inningsState.status === "not-started" && !innings1Snapshot) return;
    saveSession(id, {
      inningsNumber,
      innings1Snapshot,
      inningsState,
    });
  }, [id, inningsNumber, innings1Snapshot, inningsState, sessionLoaded]);

  // ─── Auto-close notifications & backend save ──────────────────────────────
  const prevStatusRef = useRef(inningsState.status);
  // biome-ignore lint/correctness/useExhaustiveDependencies: inningsState reference intentional — we only want to fire on status change
  useEffect(() => {
    if (
      prevStatusRef.current !== "closed" &&
      inningsState.status === "closed"
    ) {
      const reason = inningsState.autoCloseReason;
      if (reason === "target_reached") {
        toast.success("Target reached! Innings ended.", { icon: "🏆" });
      } else if (reason === "overs_complete") {
        toast("All overs complete. Innings ended.", { icon: "✅" });
      } else if (reason === "all_out") {
        toast.error("All out! Innings ended.", { icon: "⚡" });
      }

      // Fire-and-forget: save innings result to backend after auto-close
      if (match && reason !== "manual") {
        const snap = inningsState;
        const team0Id = match.teams[0]?.id ?? 0n;
        const team1Id = match.teams[1]?.id ?? 0n;
        const battingTeamId = inningsNumber === 1 ? team0Id : team1Id;
        const bowlingTeamId = inningsNumber === 1 ? team1Id : team0Id;
        // For 2nd innings auto-close, we may have a result
        let resultStr: string | null = null;
        if (inningsNumber === 2 && innings1Snapshot) {
          resultStr = buildResultText(
            match,
            innings1Snapshot,
            snap,
            reason ?? "manual",
            maxOvers,
          );
        }
        void saveInningsResult
          .mutateAsync({
            matchId,
            isFirstInnings: inningsNumber === 1,
            battingTeamId,
            bowlingTeamId,
            totalRuns: BigInt(snap.totalRuns),
            wickets: BigInt(snap.wickets),
            legalBalls: BigInt(snap.legalBalls),
            wides: BigInt(snap.wides),
            noBalls: BigInt(snap.noBalls),
            byes: BigInt(snap.byes),
            legByes: BigInt(snap.legByes),
            result: resultStr,
          })
          .catch(() => {});
      }
    }
    prevStatusRef.current = inningsState.status;
  }, [inningsState.status, inningsState.autoCloseReason]);

  const [wicketDialogOpen, setWicketDialogOpen] = useState(false);
  const [endInningsDialogOpen, setEndInningsDialogOpen] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [isRematching, setIsRematching] = useState(false);

  const rematchMutation = useRematch();
  const saveInningsResult = useSaveInningsResult();

  // Show final result when 2nd innings closes
  useEffect(() => {
    if (
      inningsNumber === 2 &&
      inningsState.status === "closed" &&
      innings1Snapshot
    ) {
      // Small delay for smooth UX
      const t = setTimeout(() => setShowFinalResult(true), 500);
      return () => clearTimeout(t);
    }
  }, [inningsNumber, inningsState.status, innings1Snapshot]);

  // Derived player lists
  const bowlingTeamIndex = inningsNumber === 1 ? 1 : 0;
  const bowlingTeam = match?.teams[bowlingTeamIndex];

  // Players who haven't batted / aren't out
  const availableNextBatsmen =
    battingTeam?.players.filter((p) => {
      const stats = inningsState.batsmanStats.get(Number(p.id));
      if (!stats) return true; // hasn't batted
      if (stats.isOut) return false; // already out
      if (Number(p.id) === inningsState.nonStrikerId) return false; // currently in
      return true;
    }) ?? [];

  const handleWicket = useCallback(
    (dismissalType: DismissalType, fielderId?: number, runs?: number) => {
      scoring.recordBall({ type: "WICKET", dismissalType, fielderId, runs });
      setWicketDialogOpen(false);
      toast.error("Wicket! Select next batsman", { icon: "⚡" });
    },
    [scoring],
  );

  const handleNextBatsman = useCallback(
    (playerId: number) => {
      scoring.setNextBatsman(playerId);
    },
    [scoring],
  );

  const handleNextBowler = useCallback(
    (bowlerId: number) => {
      scoring.confirmBowlerChange(bowlerId);
    },
    [scoring],
  );

  const handleEndInnings = useCallback(() => {
    const snapshot = { ...scoring.inningsState };
    if (inningsNumber === 1) {
      setInnings1Snapshot(snapshot);
    }
    scoring.closeInnings("manual");
    setEndInningsDialogOpen(false);

    // Fire-and-forget: save innings result to backend
    if (match) {
      const team0Id = match.teams[0]?.id ?? 0n;
      const team1Id = match.teams[1]?.id ?? 0n;
      const battingTeamId = inningsNumber === 1 ? team0Id : team1Id;
      const bowlingTeamId = inningsNumber === 1 ? team1Id : team0Id;
      void saveInningsResult
        .mutateAsync({
          matchId,
          isFirstInnings: inningsNumber === 1,
          battingTeamId,
          bowlingTeamId,
          totalRuns: BigInt(snapshot.totalRuns),
          wickets: BigInt(snapshot.wickets),
          legalBalls: BigInt(snapshot.legalBalls),
          wides: BigInt(snapshot.wides),
          noBalls: BigInt(snapshot.noBalls),
          byes: BigInt(snapshot.byes),
          legByes: BigInt(snapshot.legByes),
          result: null,
        })
        .catch(() => {});
    }
  }, [scoring, inningsNumber, match, matchId, saveInningsResult]);

  const handleStart2ndInnings = useCallback(() => {
    setInningsNumber(2);
    scoring.resetInnings();
  }, [scoring]);

  const handleNewMatch = useCallback(() => {
    clearSession(id);
    void navigate({ to: "/admin" });
  }, [id, navigate]);

  const handleRematch = useCallback(() => {
    setIsRematching(true);
    rematchMutation.mutate(
      { matchId },
      {
        onSuccess: (newMatchId) => {
          clearSession(id);
          void navigate({
            to: "/admin/match/$id/score",
            params: { id: newMatchId.toString() },
          });
        },
        onError: () => {
          // Fallback: navigate to admin on failure
          setIsRematching(false);
          clearSession(id);
          void navigate({ to: "/admin" });
        },
      },
    );
  }, [rematchMutation, matchId, id, navigate]);

  const striker =
    inningsState.strikerId !== null
      ? getPlayer(match!, inningsState.strikerId)
      : undefined;
  const nonStriker =
    inningsState.nonStrikerId !== null
      ? getPlayer(match!, inningsState.nonStrikerId)
      : undefined;
  const currentBowler =
    inningsState.bowlerId !== null
      ? getPlayer(match!, inningsState.bowlerId)
      : undefined;

  const strikerStats =
    inningsState.strikerId !== null
      ? inningsState.batsmanStats.get(inningsState.strikerId)
      : undefined;
  const nonStrikerStats =
    inningsState.nonStrikerId !== null
      ? inningsState.batsmanStats.get(inningsState.nonStrikerId)
      : undefined;
  const bowlerStats =
    inningsState.bowlerId !== null
      ? inningsState.bowlerStats.get(inningsState.bowlerId)
      : undefined;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            Please log in to score matches
          </p>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-4 space-y-3">
          <Skeleton
            className="h-28 rounded-2xl shimmer"
            data-ocid="scoring.loading_state"
          />
          <Skeleton className="h-20 rounded-xl shimmer" />
          <Skeleton className="h-48 rounded-xl shimmer" />
        </main>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div data-ocid="scoring.error_state" className="text-center">
            <p className="text-muted-foreground">Match not found</p>
          </div>
        </main>
      </div>
    );
  }

  const isActive = inningsState.status === "active";

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      {/* Slim top bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-screen-md mx-auto px-3 h-12 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void navigate({ to: "/admin" })}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="scoring.back.button"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          <div className="flex items-center gap-2 flex-1 justify-center">
            <span className="font-display font-bold text-sm text-foreground truncate max-w-[200px]">
              {match.name}
            </span>
            {isActive && (
              <Badge className="bg-wicket-red/20 text-wicket-red border-wicket-red/40 text-xs gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-wicket-red live-pulse inline-block" />
                LIVE
              </Badge>
            )}
            {inningsNumber === 2 && !showFinalResult && (
              <Badge className="bg-electric-blue/20 text-electric-blue border-electric-blue/40 text-xs">
                2nd Inn
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/match/${id}`;
                navigator.clipboard.writeText(link).then(
                  () => toast.success("Link copied!"),
                  () => toast.error("Failed to copy link"),
                );
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors p-1"
              data-ocid="scoring.share.button"
              title="Share scoreboard link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/admin/match/$id/correct",
                  params: { id },
                })
              }
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="scoring.edit_ball.button"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-screen-md mx-auto px-3 py-4 pb-8 space-y-3">
        {/* Final Result Screen */}
        {showFinalResult && innings1Snapshot ? (
          <FinalResultScreen
            match={match}
            innings1={innings1Snapshot}
            innings2={inningsState}
            autoCloseReason={inningsState.autoCloseReason}
            maxOvers={maxOvers}
            onNewMatch={handleNewMatch}
            onRematch={handleRematch}
            isRematching={isRematching}
          />
        ) : inningsState.status === "not-started" ? (
          <SetupScreen
            match={match}
            onStart={scoring.startInnings}
            inningsNumber={inningsNumber}
            target={target}
            maxOvers={maxOvers}
          />
        ) : inningsState.status === "closed" ? (
          <InningsSummaryScreen
            match={match}
            snapshot={inningsState}
            inningsNumber={inningsNumber}
            onStart2ndInnings={
              inningsNumber === 1 ? handleStart2ndInnings : undefined
            }
            innings1Snapshot={inningsNumber === 2 ? innings1Snapshot : null}
            target={inningsNumber === 2 ? target : undefined}
          />
        ) : (
          <>
            {/* ── Required Runs Banner (2nd innings) ── */}
            {inningsNumber === 2 &&
              target !== undefined &&
              requiredRuns !== null &&
              requiredRuns > 0 && (
                <div className="rounded-xl border border-cricket-gold/40 bg-cricket-gold/10 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-cricket-gold shrink-0" />
                    <span className="text-cricket-gold font-bold text-sm">
                      Need{" "}
                      <span className="text-lg font-black">{requiredRuns}</span>{" "}
                      runs
                      {requiredBalls !== null && requiredBalls > 0
                        ? ` from ${requiredBalls} ball${requiredBalls === 1 ? "" : "s"}`
                        : ""}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono shrink-0">
                    Target: {target}
                  </div>
                </div>
              )}

            {/* ── Score Banner ── */}
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="px-4 py-3 flex items-end justify-between gap-4">
                <div>
                  <div className="font-score font-black text-5xl text-foreground glow-green leading-none">
                    {inningsState.totalRuns}/{inningsState.wickets}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-mono flex-wrap">
                    <span>
                      {oversString}
                      {maxOvers ? ` / ${maxOvers}` : ""} ov
                    </span>
                    <span className="text-border">·</span>
                    <span className="text-electric-blue">
                      CRR {currentRunRate.toFixed(2)}
                    </span>
                    {inningsState.extras > 0 && (
                      <>
                        <span className="text-border">·</span>
                        <span>Ext {inningsState.extras}</span>
                      </>
                    )}
                    {/* Last over badge */}
                    {maxOvers &&
                      inningsState.currentOver === maxOvers - 1 &&
                      inningsState.currentOverLegalBalls < 6 && (
                        <span
                          data-ocid="scoring.last_over.toast"
                          className="ml-1 px-2 py-0.5 rounded-full bg-wicket-red/20 border border-wicket-red/40 text-wicket-red font-bold text-[10px] uppercase tracking-wider"
                        >
                          Last Over!
                        </span>
                      )}
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="text-[10px] text-muted-foreground">
                    W:{inningsState.wides} NB:{inningsState.noBalls}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    B:{inningsState.byes} LB:{inningsState.legByes}
                  </div>
                </div>
              </div>

              {/* Over progress */}
              <div className="px-4 pb-3">
                <OverProgress
                  balls={currentOverBalls}
                  currentOverLegalBalls={inningsState.currentOverLegalBalls}
                />
              </div>

              {/* Free hit banner */}
              {inningsState.isFreeHitNext && (
                <div className="px-4 py-2 bg-cricket-gold/10 border-t border-cricket-gold/30 flex items-center gap-2 animate-free-hit-glow">
                  <Zap className="w-4 h-4 text-cricket-gold" />
                  <span className="text-cricket-gold font-bold text-sm">
                    FREE HIT NEXT BALL!
                  </span>
                </div>
              )}
            </div>

            {/* ── Batsmen ── */}
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/30">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                        Batsman
                      </th>
                      <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                        R
                      </th>
                      <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                        B
                      </th>
                      <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                        4s
                      </th>
                      <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                        6s
                      </th>
                      <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground">
                        SR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {striker && strikerStats && (
                      <tr className="border-b border-border/10">
                        <td className="px-3 py-2.5 font-semibold text-foreground">
                          <span className="text-primary mr-1 text-base">*</span>
                          {striker.name}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono font-bold text-foreground">
                          {strikerStats.runs}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                          {strikerStats.balls}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-neon-green">
                          {strikerStats.fours}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-cricket-gold">
                          {strikerStats.sixes}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                          {formatSR(strikerStats.runs, strikerStats.balls)}
                        </td>
                      </tr>
                    )}
                    {nonStriker && nonStrikerStats && (
                      <tr>
                        <td className="px-3 py-2.5 text-foreground/80">
                          {nonStriker.name}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono font-bold text-foreground">
                          {nonStrikerStats.runs}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                          {nonStrikerStats.balls}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-neon-green">
                          {nonStrikerStats.fours}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-cricket-gold">
                          {nonStrikerStats.sixes}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                          {formatSR(
                            nonStrikerStats.runs,
                            nonStrikerStats.balls,
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Current Bowler ── */}
            {currentBowler && bowlerStats && (
              <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 bg-muted/30">
                        <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Bowler
                        </th>
                        <th className="text-right px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          O
                        </th>
                        <th className="text-right px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          M
                        </th>
                        <th className="text-right px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          R
                        </th>
                        <th className="text-right px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          W
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2.5 font-semibold text-electric-blue">
                          ▶ {currentBowler.name}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono">
                          {bowlerStats.overs}.{bowlerStats.ballsThisOver}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono">
                          {bowlerStats.maidens}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono font-bold text-foreground">
                          {bowlerStats.runs}
                        </td>
                        <td className="text-right px-2 py-2.5 font-mono font-bold text-wicket-red">
                          {bowlerStats.wickets}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Scoring buttons ── */}
            <div className="rounded-2xl border border-border/50 bg-card p-3">
              <ScoringButtons
                onRun={(n) => {
                  scoring.recordBall({ type: "RUNS", runs: n });
                  if (n === 6) toast("SIX! 🏏", { icon: "🏆" });
                  else if (n === 4) toast("FOUR! 🏏", { icon: "🟢" });
                }}
                onWide={() => {
                  scoring.recordBall({ type: "WIDE" });
                }}
                onNoBall={() => {
                  scoring.recordBall({ type: "NO_BALL" });
                  toast("No Ball — Free Hit next!", { icon: "⚡" });
                }}
                onBye={(n) => scoring.recordBall({ type: "BYE", runs: n })}
                onLegBye={(n) =>
                  scoring.recordBall({ type: "LEG_BYE", runs: n })
                }
                onWicket={() => setWicketDialogOpen(true)}
                onUndo={() => {
                  scoring.undoLastBall();
                  toast("Last ball undone", { icon: "↩️" });
                }}
                onEndInnings={() => setEndInningsDialogOpen(true)}
                isFreeHit={inningsState.isFreeHitNext}
                disabled={
                  inningsState.pendingBatsmanChange ||
                  inningsState.pendingBowlerChange
                }
              />
            </div>

            {/* ── Partnership ── */}
            {inningsState.currentPartnership && (
              <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-2.5 flex items-center gap-3 text-xs">
                <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Partnership:</span>
                <span className="font-mono font-bold text-foreground">
                  {inningsState.currentPartnership.runs} (
                  {inningsState.currentPartnership.balls} balls)
                </span>
              </div>
            )}

            {/* ── Fall of wickets ── */}
            {inningsState.fallOfWickets.length > 0 && (
              <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Fall of Wickets
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {inningsState.fallOfWickets.map((fow) => {
                    const batsman = getPlayer(match, fow.batsmanId);
                    return (
                      <span
                        key={`fow-${fow.wickets}-${fow.score}`}
                        className="text-xs bg-muted rounded px-2 py-0.5 font-mono text-foreground"
                      >
                        {fow.score}/{fow.wickets}
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
          </>
        )}
      </main>

      {/* ── Dialogs ── */}
      {match && !showFinalResult && (
        <WicketDialog
          open={wicketDialogOpen}
          onClose={() => setWicketDialogOpen(false)}
          onConfirm={handleWicket}
          match={match}
          strikerId={inningsState.strikerId}
          bowlingTeamPlayers={bowlingTeam?.players ?? []}
        />
      )}

      {/* Select next batsman */}
      <SelectBatsmanDialog
        open={isActive && inningsState.pendingBatsmanChange}
        onSelect={handleNextBatsman}
        availablePlayers={availableNextBatsmen}
      />

      {/* Select next bowler */}
      <SelectBowlerDialog
        open={
          isActive &&
          inningsState.pendingBowlerChange &&
          !inningsState.pendingBatsmanChange
        }
        onSelect={handleNextBowler}
        availablePlayers={bowlingTeam?.players ?? []}
        currentBowlerId={inningsState.bowlerId}
      />

      {/* End innings confirmation */}
      <EndInningsConfirmDialog
        open={endInningsDialogOpen}
        onClose={() => setEndInningsDialogOpen(false)}
        onConfirm={handleEndInnings}
        totalRuns={inningsState.totalRuns}
        wickets={inningsState.wickets}
        oversString={oversString}
        inningsNumber={inningsNumber}
      />

      <AppFooter />
    </div>
  );
}
