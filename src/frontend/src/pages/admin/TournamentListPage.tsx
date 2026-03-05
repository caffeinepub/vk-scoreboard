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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export function TournamentListPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { tournaments, createTournament, deleteTournament } = useTournaments();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [teams, setTeams] = useState<string[]>(["", ""]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; teams?: string }>({});

  useEffect(() => {
    if (!isLoggedIn) void navigate({ to: "/admin/login" });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  const addTeamField = () => setTeams([...teams, ""]);
  const removeTeamField = (i: number) =>
    setTeams(teams.filter((_, idx) => idx !== i));
  const updateTeam = (i: number, val: string) => {
    const updated = [...teams];
    updated[i] = val;
    setTeams(updated);
  };

  const handleCreate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Tournament name is required";
    const validTeams = teams.filter((t) => t.trim());
    if (validTeams.length < 2)
      newErrors.teams = "At least 2 teams are required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const t = createTournament(
      name.trim(),
      validTeams.map((t) => t.trim()),
    );
    setShowForm(false);
    setName("");
    setTeams(["", ""]);
    setErrors({});
    void navigate({ to: "/admin/tournament/$id", params: { id: t.id } });
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) deleteTournament(deleteTarget);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => void navigate({ to: "/admin" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="tournaments.back.button"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl text-foreground">
                Tournaments
              </h1>
              <p className="text-sm text-muted-foreground">
                Create and manage multi-team tournaments
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green h-10 shrink-0"
            data-ocid="tournaments.create.button"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Tournament
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4 animate-fade-in">
            <h2 className="font-display font-bold text-lg text-foreground">
              New Tournament
            </h2>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tournament Name *
              </Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. VK Premier League 2025"
                className="h-11 bg-input border-border/60"
                data-ocid="tournaments.name.input"
              />
              {errors.name && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="tournaments.name.error_state"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Teams *
              </Label>
              {teams.map((team, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: team fields are positional
                <div key={i} className="flex gap-2">
                  <Input
                    value={team}
                    onChange={(e) => updateTeam(i, e.target.value)}
                    placeholder={`Team ${i + 1} name`}
                    className="h-10 bg-input border-border/60 flex-1"
                    data-ocid={`tournaments.team.input.${i + 1}`}
                  />
                  {teams.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeTeamField(i)}
                      className="w-10 h-10 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive/70 hover:text-destructive hover:bg-destructive/20 flex items-center justify-center shrink-0"
                      data-ocid={`tournaments.remove_team.button.${i + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.teams && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="tournaments.teams.error_state"
                >
                  {errors.teams}
                </p>
              )}
              <button
                type="button"
                onClick={addTeamField}
                className="flex items-center gap-1.5 text-sm text-primary/80 hover:text-primary transition-colors"
                data-ocid="tournaments.add_team.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another team
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green"
                data-ocid="tournaments.create.submit_button"
              >
                Create Tournament
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
                className="border-border/50 text-muted-foreground"
                data-ocid="tournaments.create.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tournament list */}
        {tournaments.length === 0 && !showForm ? (
          <div
            data-ocid="tournaments.empty_state"
            className="text-center py-16 space-y-3"
          >
            <div className="w-16 h-16 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-semibold">No tournaments yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first tournament with multiple teams.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((tournament, i) => (
              <div
                key={tournament.id}
                data-ocid={`tournaments.item.${i + 1}`}
                className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-4 hover:border-primary/30 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {tournament.teams.length} teams
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {tournament.fixtures.length} fixtures
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(tournament.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                        },
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(tournament.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 text-destructive/60 hover:text-destructive hover:bg-destructive/20 transition-all"
                    data-ocid={`tournaments.delete_button.${i + 1}`}
                    title="Delete tournament"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void navigate({
                        to: "/admin/tournament/$id",
                        params: { id: tournament.id },
                      })
                    }
                    className="h-8 px-3 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all text-sm font-medium flex items-center gap-1"
                    data-ocid={`tournaments.open.button.${i + 1}`}
                  >
                    Open
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(o) => !o && setDeleteDialogOpen(false)}
      >
        <AlertDialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="tournaments.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Tournament?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the tournament and all its fixtures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="tournaments.delete.cancel_button"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="tournaments.delete.confirm_button"
              onClick={handleDeleteConfirm}
              className="bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
