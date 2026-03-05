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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteMatch, useListMatches } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Play,
  Plus,
  Settings,
  Target,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const DELETED_MATCHES_KEY = "vk_deleted_matches";

function getDeletedMatchIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_MATCHES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function addDeletedMatchId(id: string): void {
  try {
    const existing = getDeletedMatchIds();
    existing.add(id);
    localStorage.setItem(DELETED_MATCHES_KEY, JSON.stringify([...existing]));
  } catch {
    // ignore
  }
}

function StatusBadge({ status }: { status: Match["status"] }) {
  if (status === "live") {
    return (
      <Badge className="bg-wicket-red/20 text-wicket-red border-wicket-red/40 gap-1 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-wicket-red live-pulse inline-block" />
        LIVE
      </Badge>
    );
  }
  if (status === "completed") {
    return (
      <Badge className="bg-neon-green/10 text-neon-green border-neon-green/20 text-xs">
        Done
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground border-border/50 text-xs"
    >
      Setup
    </Badge>
  );
}

interface AdminMatchCardProps {
  match: Match;
  index: number;
  onDeleteRequest: (matchId: bigint) => void;
}

function AdminMatchCard({
  match,
  index,
  onDeleteRequest,
}: AdminMatchCardProps) {
  const navigate = useNavigate();

  return (
    <div
      data-ocid={`admin.matches.item.${index}`}
      className={cn(
        "rounded-xl border border-border/50 bg-card p-4 space-y-3 animate-slide-up",
        match.status === "live" && "border-wicket-red/30",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground leading-tight truncate">
            {match.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 shrink-0" />
            {new Date(Number(match.date) / 1_000_000).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            )}
            {match.maxOvers && (
              <>
                <span className="text-border">·</span>{" "}
                {match.maxOvers.toString()} ov
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={match.status} />
          {/* Delete button */}
          <button
            type="button"
            data-ocid={`admin.matches.delete_button.${index}`}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 text-destructive/60 hover:text-destructive hover:bg-destructive/20 hover:border-destructive/60 transition-all active:scale-95"
            onClick={() => onDeleteRequest(match.id)}
            title="Delete match"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Teams */}
      <div className="flex gap-3">
        {match.teams.map((team) => (
          <div
            key={team.id.toString()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Users className="w-3 h-3 shrink-0" />
            <span className="font-medium text-foreground/80">{team.name}</span>
            <span className="text-muted-foreground/60">
              ({team.players.length}p)
            </span>
          </div>
        ))}
        {match.teams.length === 0 && (
          <span className="text-xs text-muted-foreground/50 italic">
            No teams added
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {match.status === "setup" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-border/50 text-foreground hover:border-primary/40 h-9"
            onClick={() =>
              void navigate({
                to: "/admin/match/$id/setup",
                params: { id: match.id.toString() },
              })
            }
            data-ocid={`admin.matches.setup.button.${index}`}
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Setup
          </Button>
        )}
        <Button
          size="sm"
          className={cn(
            "flex-1 h-9",
            match.status === "live"
              ? "bg-wicket-red/20 text-wicket-red border border-wicket-red/40 hover:bg-wicket-red/30"
              : match.status === "setup" && match.teams.length < 2
                ? "opacity-50 bg-muted text-muted-foreground"
                : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30",
          )}
          onClick={() =>
            void navigate({
              to: "/admin/match/$id/score",
              params: { id: match.id.toString() },
            })
          }
          disabled={match.status === "setup" && match.teams.length < 2}
          data-ocid={`admin.matches.score.button.${index}`}
        >
          {match.status === "live" ? (
            <>
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Scoring
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Start Scoring
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-9 px-3 text-muted-foreground hover:text-foreground"
          onClick={() =>
            void navigate({
              to: "/match/$id",
              params: { id: match.id.toString() },
            })
          }
          data-ocid={`admin.matches.view.button.${index}`}
          title="View public scoreboard"
        >
          <Target className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: matches, isLoading, refetch } = useListMatches();
  const deleteMatch = useDeleteMatch();

  const [deletedIds, setDeletedIds] = useState<Set<string>>(getDeletedMatchIds);
  const [deleteTargetId, setDeleteTargetId] = useState<bigint | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      void navigate({ to: "/admin/login" });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  const handleDeleteRequest = (matchId: bigint) => {
    setDeleteTargetId(matchId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId === null) return;
    const idStr = deleteTargetId.toString();
    addDeletedMatchId(idStr);
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(idStr);
      return next;
    });
    deleteMatch.mutate(
      { matchId: deleteTargetId },
      {
        onSettled: () => {
          void refetch();
        },
      },
    );
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const visibleMatches =
    matches?.filter((m) => !deletedIds.has(m.id.toString())) ?? [];

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display font-black text-2xl text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your cricket matches
            </p>
          </div>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green h-10 shrink-0"
            data-ocid="admin.create_match.button"
          >
            <Link to="/admin/match/create">
              <Plus className="w-4 h-4 mr-1.5" />
              New Match
            </Link>
          </Button>
        </div>

        {/* Quick links */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border/50 text-muted-foreground hover:text-foreground"
            data-ocid="admin.tournaments.link"
          >
            <Link to="/admin/tournaments">
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              Tournaments
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border/50 text-muted-foreground hover:text-foreground"
            data-ocid="admin.players.link"
          >
            <Link to="/admin/players">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Player Profiles
            </Link>
          </Button>
        </div>

        {/* Match list */}
        {isLoading ? (
          <div data-ocid="admin.matches.loading_state" className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable identity
                key={i}
                className="h-36 rounded-xl shimmer animate-pulse"
              />
            ))}
          </div>
        ) : visibleMatches.length > 0 ? (
          <div className="space-y-3">
            {visibleMatches.map((match, i) => (
              <AdminMatchCard
                key={match.id.toString()}
                match={match}
                index={i + 1}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </div>
        ) : (
          <div
            data-ocid="admin.matches.empty_state"
            className="text-center py-16 space-y-4"
          >
            <div className="w-16 h-16 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto">
              <Activity className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-foreground font-semibold">No matches yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first match to get started
              </p>
            </div>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="admin.create_first_match.button"
            >
              <Link to="/admin/match/create">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Match
              </Link>
            </Button>
          </div>
        )}
      </main>

      <AppFooter />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(o) => !o && handleDeleteCancel()}
      >
        <AlertDialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="admin.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete this match?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This match will be permanently removed. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.delete.cancel_button"
              onClick={handleDeleteCancel}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.delete.confirm_button"
              onClick={handleDeleteConfirm}
              className="bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
            >
              Delete Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
