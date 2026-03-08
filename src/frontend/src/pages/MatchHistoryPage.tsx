import type { Match } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clearSession } from "@/hooks/useCricketScoring";
import { useDeleteMatch, useListMatches, useRematch } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  CheckSquare,
  History,
  RefreshCw,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FilterTab = "all" | "live" | "completed";

function oversStr(legalBalls: bigint): string {
  const n = Number(legalBalls);
  return `${Math.floor(n / 6)}.${n % 6}`;
}

function MatchHistoryCard({
  match,
  index,
  selectionMode,
  selected,
  onToggleSelect,
  onDelete,
  onRematch,
}: {
  match: Match;
  index: number;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRematch: (id: bigint) => void;
}) {
  const navigate = useNavigate();
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  const team1 = match.teams[0];
  const team2 = match.teams[1];

  const formatDate = (ts: bigint) => {
    const d = new Date(Number(ts) / 1_000_000);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect(match.id.toString());
    } else {
      void navigate({ to: "/match/$id", params: { id: match.id.toString() } });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        data-ocid={`history.item.${index}`}
        className={cn(
          "w-full text-left rounded-xl border bg-card p-4 space-y-3 transition-all animate-slide-up cursor-pointer",
          selected
            ? "border-primary/60 bg-primary/5"
            : match.status === "live"
              ? "border-wicket-red/30 hover:border-wicket-red/50"
              : match.status === "completed"
                ? "border-neon-green/20 hover:border-neon-green/40"
                : "border-border/50 hover:border-primary/30",
          selectionMode && "pr-12",
        )}
        style={{ animationDelay: `${index * 40}ms` }}
        onClick={handleClick}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground leading-tight truncate">
              {match.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              {formatDate(match.date)}
              {match.maxOvers && (
                <>
                  <span className="text-border">·</span>
                  {match.maxOvers.toString()} ov
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {match.status === "live" && (
              <Badge className="bg-wicket-red/20 text-wicket-red border-wicket-red/40 gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-wicket-red live-pulse inline-block" />
                LIVE
              </Badge>
            )}
            {match.status === "completed" && (
              <Badge className="bg-neon-green/10 text-neon-green border-neon-green/20 text-xs">
                Done
              </Badge>
            )}
            {match.status === "setup" && (
              <Badge
                variant="outline"
                className="text-muted-foreground border-border/50 text-xs"
              >
                Setup
              </Badge>
            )}
            {/* Individual delete button (only when not in selection mode) */}
            {!selectionMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(match.id.toString());
                }}
                className="w-7 h-7 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive/70 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-all active:scale-95"
                data-ocid={`history.delete_button.${index}`}
                title="Delete match"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Teams + scores */}
        {(team1 || team2) && (
          <div className="flex items-center gap-3">
            {team1 && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3 h-3 shrink-0" />
                  <span className="font-medium text-foreground/80 truncate">
                    {team1.name}
                  </span>
                </div>
                {inn1 && (
                  <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                    {Number(inn1.totalRuns)}/{Number(inn1.wickets)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({oversStr(inn1.legalBalls)} ov)
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="text-muted-foreground/50 font-bold text-xs shrink-0">
              VS
            </div>
            {team2 && (
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80 truncate">
                    {team2.name}
                  </span>
                  <Users className="w-3 h-3 shrink-0" />
                </div>
                {inn2 && (
                  <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                    {Number(inn2.totalRuns)}/{Number(inn2.wickets)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({oversStr(inn2.legalBalls)} ov)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {match.result && (
          <div className="pt-2 border-t border-border/30 flex items-center gap-1.5 text-xs text-neon-green">
            <Trophy className="w-3 h-3" />
            <span>{match.result}</span>
          </div>
        )}

        {/* Rematch button — only for completed matches */}
        {match.status === "completed" && (
          <div className="pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRematch(match.id);
              }}
              className="flex items-center gap-1.5 text-xs text-electric-blue hover:text-electric-blue/80 transition-colors"
              data-ocid={`history.rematch_button.${index}`}
            >
              <RefreshCw className="w-3 h-3" />
              Rematch
            </button>
          </div>
        )}
      </button>

      {/* Checkbox overlay when in selection mode */}
      {selectionMode && (
        <div className="absolute top-3 right-3 pointer-events-none">
          <Checkbox
            checked={selected}
            data-ocid={`history.item_checkbox.${index}`}
            className="w-5 h-5 pointer-events-auto border-2 border-primary/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            onCheckedChange={() => onToggleSelect(match.id.toString())}
          />
        </div>
      )}
    </div>
  );
}

export function MatchHistoryPage() {
  const { data: matches, isLoading } = useListMatches();
  const deleteMatch = useDeleteMatch();
  const rematchMutation = useRematch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [_deletingId, setDeletingId] = useState<string | null>(null);
  const [rematchTargetId, setRematchTargetId] = useState<bigint | null>(null);
  const [rematchDialogOpen, setRematchDialogOpen] = useState(false);

  const handleRematchConfirm = () => {
    if (!rematchTargetId) return;
    rematchMutation.mutate(
      { matchId: rematchTargetId },
      {
        onSuccess: (newMatchId) => {
          // IMPORTANT: Do NOT clear the old match session — previous match data stays saved
          // Only clear the new match's potential stale session
          clearSession(newMatchId.toString());
          void navigate({
            to: "/admin/match/$id/score",
            params: { id: newMatchId.toString() },
          });
        },
        onError: () => {
          toast.error("Failed to create rematch. Please try again.");
        },
      },
    );
    setRematchDialogOpen(false);
    setRematchTargetId(null);
  };

  const filtered = (matches ?? []).filter((m) => {
    if (filter === "all") return true;
    if (filter === "live") return m.status === "live";
    if (filter === "completed") return m.status === "completed";
    return true;
  });

  // Sort: live first, then completed, then setup
  const sorted = [...filtered].sort((a, b) => {
    const order = (s: Match["status"]) =>
      s === "live" ? 0 : s === "completed" ? 1 : 2;
    return order(a.status) - order(b.status);
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(sorted.map((m) => m.id.toString())));
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          deleteMatch.mutateAsync({ matchId: BigInt(id) }),
        ),
      );
      toast.success(
        `${selectedIds.size} match${selectedIds.size > 1 ? "es" : ""} deleted`,
      );
      cancelSelection();
    } catch {
      toast.error("Failed to delete some matches");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMatch.mutateAsync({ matchId: BigInt(id) });
      toast.success("Match deleted");
    } catch {
      toast.error("Failed to delete match");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-6 space-y-6 pb-28">
        {/* Hero */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl text-foreground">
                Match History
              </h1>
              <p className="text-sm text-muted-foreground">
                All matches — live, completed, and in setup
              </p>
            </div>
          </div>

          {/* Select mode toggle */}
          {!selectionMode && sorted.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode(true)}
              className="border-border/60 text-muted-foreground hover:text-foreground shrink-0"
              data-ocid="history.select_mode.toggle"
            >
              <CheckSquare className="w-4 h-4 mr-1.5" />
              Select
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="bg-muted/30 border border-border/40">
            <TabsTrigger value="all" data-ocid="history.all.tab">
              All
            </TabsTrigger>
            <TabsTrigger value="live" data-ocid="history.live.tab">
              Live
            </TabsTrigger>
            <TabsTrigger value="completed" data-ocid="history.completed.tab">
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div data-ocid="history.loading_state" className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                key={i}
                className="h-28 rounded-xl shimmer animate-pulse"
              />
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.map((match, i) => (
              <MatchHistoryCard
                key={match.id.toString()}
                match={match}
                index={i + 1}
                selectionMode={selectionMode}
                selected={selectedIds.has(match.id.toString())}
                onToggleSelect={toggleSelect}
                onDelete={(mid) => void handleDeleteSingle(mid)}
                onRematch={(id) => {
                  setRematchTargetId(id);
                  setRematchDialogOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div
            data-ocid="history.empty_state"
            className="text-center py-16 space-y-3"
          >
            <div className="w-16 h-16 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto">
              <History className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-semibold">No matches found</p>
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "No matches have been created yet."
                : `No ${filter} matches.`}
            </p>
          </div>
        )}
      </main>

      {/* Selection action bar */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border/50 px-4 py-3 safe-area-inset-bottom">
          <div className="max-w-screen-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary hover:text-primary/80 font-medium"
                data-ocid="history.select_all.button"
              >
                Select All
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelSelection}
                className="border-border/60 text-muted-foreground"
                data-ocid="history.cancel_select.button"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleDeleteSelected()}
                disabled={selectedIds.size === 0 || isDeleting}
                className="bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
                data-ocid="history.delete_selected.button"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {isDeleting
                  ? "Deleting..."
                  : `Delete${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rematch confirmation dialog */}
      <AlertDialog
        open={rematchDialogOpen}
        onOpenChange={(o) => !o && setRematchDialogOpen(false)}
      >
        <AlertDialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="history.rematch.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-electric-blue" />
              Start Rematch?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will start a fresh match with the same teams and players. The
              previous match result and scorecard will remain saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="history.rematch.cancel_button"
              onClick={() => {
                setRematchDialogOpen(false);
                setRematchTargetId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="history.rematch.confirm_button"
              onClick={handleRematchConfirm}
              disabled={rematchMutation.isPending}
              className="bg-electric-blue/20 text-electric-blue border border-electric-blue/40 hover:bg-electric-blue/30"
            >
              {rematchMutation.isPending ? "Creating..." : "Start Rematch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppFooter />
    </div>
  );
}
