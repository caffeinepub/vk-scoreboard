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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteMatch, useListMatches } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  Hash,
  Play,
  Plus,
  Settings,
  Target,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Saved Teams localStorage helpers ───────────────────────────────────────

const DELETED_MATCHES_KEY = "vk_deleted_matches";
const SAVED_TEAMS_KEY = "vk_saved_teams";

interface SavedTeamPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
}

interface SavedTeam {
  id: string;
  name: string;
  players: SavedTeamPlayer[];
}

function getSavedTeams(): SavedTeam[] {
  try {
    const raw = localStorage.getItem(SAVED_TEAMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedTeam[];
  } catch {
    return [];
  }
}

function setSavedTeams(teams: SavedTeam[]): void {
  try {
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
  } catch {
    // ignore
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Deleted matches helpers ─────────────────────────────────────────────────

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

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

// ─── Admin Match Card ─────────────────────────────────────────────────────────

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

// ─── Saved Teams Section ──────────────────────────────────────────────────────

function SavedTeamsSection() {
  const [savedTeams, setSavedTeamsState] = useState<SavedTeam[]>(getSavedTeams);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Team rename
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");

  // Create new team
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Player editing (one at a time globally)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editPlayerJersey, setEditPlayerJersey] = useState("");

  // Add player per team
  const [addPlayerTeamId, setAddPlayerTeamId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerJersey, setNewPlayerJersey] = useState("");

  const persist = (teams: SavedTeam[]) => {
    setSavedTeamsState(teams);
    setSavedTeams(teams);
  };

  const handleCreateTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    const newTeam: SavedTeam = { id: generateId(), name, players: [] };
    persist([...savedTeams, newTeam]);
    setNewTeamName("");
    setShowCreateTeam(false);
    setExpandedTeamId(newTeam.id);
    toast.success(`Team "${name}" created.`);
  };

  const handleDeleteTeam = (teamId: string) => {
    persist(savedTeams.filter((t) => t.id !== teamId));
    if (expandedTeamId === teamId) setExpandedTeamId(null);
    toast.success("Team deleted.");
  };

  const startRenameTeam = (team: SavedTeam) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  };

  const saveRenameTeam = (teamId: string) => {
    const name = editingTeamName.trim();
    if (!name) return;
    persist(savedTeams.map((t) => (t.id === teamId ? { ...t, name } : t)));
    setEditingTeamId(null);
    toast.success("Team renamed.");
  };

  const handleAddPlayer = (teamId: string) => {
    const name = newPlayerName.trim();
    if (!name) return;
    const jersey = newPlayerJersey ? Number(newPlayerJersey) : 0;
    const team = savedTeams.find((t) => t.id === teamId);
    if (!team) return;

    const nameDup = team.players.some(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    const numDup =
      jersey > 0 && team.players.some((p) => p.jerseyNumber === jersey);

    if (nameDup) {
      toast.error("A player with this name already exists in the team.");
      return;
    }
    if (numDup) {
      toast.error(`A player with jersey #${jersey} already exists.`);
      return;
    }

    const newPlayer: SavedTeamPlayer = {
      id: generateId(),
      name,
      jerseyNumber: jersey,
    };
    persist(
      savedTeams.map((t) =>
        t.id === teamId ? { ...t, players: [...t.players, newPlayer] } : t,
      ),
    );
    setNewPlayerName("");
    setNewPlayerJersey("");
    setAddPlayerTeamId(null);
    toast.success(`${name} added.`);
  };

  const handleRemovePlayer = (teamId: string, playerId: string) => {
    persist(
      savedTeams.map((t) =>
        t.id === teamId
          ? { ...t, players: t.players.filter((p) => p.id !== playerId) }
          : t,
      ),
    );
    toast.success("Player removed.");
  };

  const startEditPlayer = (player: SavedTeamPlayer) => {
    setEditingPlayerId(player.id);
    setEditPlayerName(player.name);
    setEditPlayerJersey(
      player.jerseyNumber > 0 ? String(player.jerseyNumber) : "",
    );
  };

  const saveEditPlayer = (teamId: string, playerId: string) => {
    const name = editPlayerName.trim();
    if (!name) {
      toast.error("Player name cannot be empty.");
      return;
    }
    const jersey = editPlayerJersey ? Number(editPlayerJersey) : 0;
    const team = savedTeams.find((t) => t.id === teamId);
    if (!team) return;

    const otherPlayers = team.players.filter((p) => p.id !== playerId);
    const nameDup = otherPlayers.some(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    const numDup =
      jersey > 0 && otherPlayers.some((p) => p.jerseyNumber === jersey);

    if (nameDup) {
      toast.error("A player with this name already exists in the team.");
      return;
    }
    if (numDup) {
      toast.error(`A player with jersey #${jersey} already exists.`);
      return;
    }

    persist(
      savedTeams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              players: t.players.map((p) =>
                p.id === playerId ? { ...p, name, jerseyNumber: jersey } : p,
              ),
            }
          : t,
      ),
    );
    setEditingPlayerId(null);
    toast.success("Player updated.");
  };

  return (
    <section data-ocid="admin.saved_teams.section" className="mt-8 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Saved Teams
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage reusable teams and player lists
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateTeam(!showCreateTeam);
            setNewTeamName("");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors text-sm font-medium"
          data-ocid="admin.saved_teams.create.button"
        >
          <Plus className="w-3.5 h-3.5" />
          New Team
        </button>
      </div>

      {/* Create team inline form */}
      {showCreateTeam && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-primary">
            Create New Saved Team
          </p>
          <div className="flex gap-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name (e.g. VK Warriors)"
              className="flex-1 h-9 text-sm bg-input border-border/60"
              onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim()}
              className="px-3 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors text-sm font-medium"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreateTeam(false)}
              className="px-2 h-9 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Team cards */}
      {savedTeams.length === 0 ? (
        <div
          data-ocid="admin.saved_teams.empty_state"
          className="text-center py-10 rounded-xl border border-dashed border-border/50"
        >
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No saved teams yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Create a team to reuse players across matches
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedTeams.map((team, ti) => {
            const isExpanded = expandedTeamId === team.id;
            const isEditingName = editingTeamId === team.id;

            return (
              <div
                key={team.id}
                data-ocid={`admin.saved_teams.team.item.${ti + 1}`}
                className="rounded-xl border border-border/50 bg-card overflow-hidden"
              >
                {/* Team header */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        className="flex-1 h-8 text-sm bg-input border-border/60"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRenameTeam(team.id);
                          if (e.key === "Escape") setEditingTeamId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => saveRenameTeam(team.id)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTeamId(null)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTeamId(isExpanded ? null : team.id)
                        }
                        className="flex items-center gap-2 flex-1 text-left"
                        data-ocid={`admin.saved_teams.team.expand.toggle.${ti + 1}`}
                      >
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                            isExpanded && "rotate-90",
                          )}
                        />
                        <span className="font-semibold text-sm text-foreground">
                          {team.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({team.players.length}p)
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startRenameTeam(team)}
                        className="w-7 h-7 flex items-center justify-center rounded text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
                        data-ocid={`admin.saved_teams.team.edit_button.${ti + 1}`}
                        title="Rename team"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team.id)}
                        className="w-7 h-7 flex items-center justify-center rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        data-ocid={`admin.saved_teams.team.delete_button.${ti + 1}`}
                        title="Delete team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Expanded player list */}
                {isExpanded && (
                  <div className="border-t border-border/30 px-3 pb-3 pt-2 space-y-2">
                    {/* Players */}
                    {team.players.length > 0 ? (
                      <div className="space-y-1">
                        {team.players.map((player, pi) => {
                          const isEditingThis = editingPlayerId === player.id;

                          if (isEditingThis) {
                            return (
                              <div
                                key={player.id}
                                className="rounded-lg border border-primary/30 bg-primary/5 p-2 space-y-1.5"
                              >
                                <div className="flex gap-2">
                                  <Input
                                    value={editPlayerName}
                                    onChange={(e) =>
                                      setEditPlayerName(e.target.value)
                                    }
                                    placeholder="Player name"
                                    className="flex-1 h-8 text-xs bg-input border-border/60"
                                    autoFocus
                                  />
                                  <div className="relative w-16">
                                    <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                    <Input
                                      type="number"
                                      value={editPlayerJersey}
                                      onChange={(e) =>
                                        setEditPlayerJersey(e.target.value)
                                      }
                                      placeholder="No"
                                      min="0"
                                      max="99"
                                      className="pl-5 h-8 text-xs bg-input border-border/60"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      saveEditPlayer(team.id, player.id)
                                    }
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-colors text-xs font-medium"
                                    data-ocid={`admin.saved_teams.player.edit_button.${pi + 1}`}
                                  >
                                    <Check className="w-3 h-3" />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPlayerId(null)}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground border border-border/40 hover:bg-muted/80 transition-colors text-xs"
                                  >
                                    <X className="w-3 h-3" />
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemovePlayer(team.id, player.id)
                                    }
                                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors text-xs"
                                    data-ocid={`admin.saved_teams.player.delete_button.${pi + 1}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Remove
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={player.id}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 text-sm group hover:bg-muted/60 transition-colors"
                            >
                              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-mono text-primary shrink-0">
                                {player.jerseyNumber > 0
                                  ? player.jerseyNumber
                                  : "—"}
                              </span>
                              <span className="text-foreground flex-1 text-xs truncate">
                                {player.name}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => startEditPlayer(player)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
                                  data-ocid={`admin.saved_teams.player.edit_button.${pi + 1}`}
                                  title="Edit player"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePlayer(team.id, player.id)
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  data-ocid={`admin.saved_teams.player.delete_button.${pi + 1}`}
                                  title="Remove player"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic py-1">
                        No players yet
                      </p>
                    )}

                    {/* Add player inline */}
                    {addPlayerTeamId === team.id ? (
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-2 space-y-1.5">
                        <div className="flex gap-2">
                          <Input
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="Player name"
                            className="flex-1 h-8 text-xs bg-input border-border/60"
                            autoFocus
                            data-ocid="admin.saved_teams.add_player.input"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddPlayer(team.id);
                            }}
                          />
                          <div className="relative w-14">
                            <Hash className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                            <Input
                              type="number"
                              value={newPlayerJersey}
                              onChange={(e) =>
                                setNewPlayerJersey(e.target.value)
                              }
                              placeholder="No"
                              min="0"
                              max="99"
                              className="pl-5 h-8 text-xs bg-input border-border/60"
                            />
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddPlayer(team.id)}
                            disabled={!newPlayerName.trim()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-40 transition-colors text-xs font-medium"
                            data-ocid="admin.saved_teams.add_player.button"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddPlayerTeamId(null);
                              setNewPlayerName("");
                              setNewPlayerJersey("");
                            }}
                            className="px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddPlayerTeamId(team.id);
                          setNewPlayerName("");
                          setNewPlayerJersey("");
                        }}
                        className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add player
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Admin Dashboard Page ─────────────────────────────────────────────────────

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

        {/* Saved Teams section */}
        <SavedTeamsSection />
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
