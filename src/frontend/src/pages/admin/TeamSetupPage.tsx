import { Color } from "@/backend.d";
import type { Team } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAddPlayer, useAddTeam, useGetMatch } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { CheckCircle, Hash, Loader2, Play, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const COLOR_OPTIONS = [
  { value: Color.red, label: "Red", bg: "bg-red-500" },
  { value: Color.blue, label: "Blue", bg: "bg-blue-500" },
  { value: Color.green, label: "Green", bg: "bg-green-500" },
  {
    value: Color.black,
    label: "Black",
    bg: "bg-gray-800 border border-gray-600",
  },
  { value: Color.white, label: "White", bg: "bg-white border border-gray-300" },
  { value: Color.yellow, label: "Yellow", bg: "bg-yellow-400" },
];

function TeamSection({
  matchId,
  teamSlot,
  existingTeam,
}: {
  matchId: bigint;
  teamSlot: 1 | 2;
  existingTeam: Team | undefined;
}) {
  const addTeamMutation = useAddTeam();
  const addPlayerMutation = useAddPlayer();

  const [teamName, setTeamName] = useState("");
  const [teamColor, setTeamColor] = useState<Color>(
    teamSlot === 1 ? Color.blue : Color.red,
  );
  const [playerName, setPlayerName] = useState("");
  const [jerseyNum, setJerseyNum] = useState("");

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    try {
      await addTeamMutation.mutateAsync({
        matchId,
        teamName: teamName.trim(),
        color: teamColor,
      });
      toast.success(`${teamName} added!`);
      setTeamName("");
    } catch (_err) {
      toast.error("Failed to add team");
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingTeam || !playerName.trim()) return;
    const jersey = jerseyNum
      ? BigInt(jerseyNum)
      : BigInt(existingTeam.players.length + 1);
    try {
      await addPlayerMutation.mutateAsync({
        matchId,
        teamId: existingTeam.id,
        playerName: playerName.trim(),
        jerseyNumber: jersey,
      });
      toast.success(`${playerName} added!`);
      setPlayerName("");
      setJerseyNum("");
    } catch (_err) {
      toast.error("Failed to add player");
    }
  };

  const selectedColorObj = COLOR_OPTIONS.find((c) => c.value === teamColor);

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Section header */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border/30 flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="font-display font-bold text-sm text-foreground">
          Team {teamSlot}
        </span>
        {existingTeam && (
          <span className="ml-auto flex items-center gap-1 text-xs text-neon-green">
            <CheckCircle className="w-3.5 h-3.5" />
            {existingTeam.name}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Add team form */}
        {!existingTeam ? (
          <form
            onSubmit={(e) => void handleAddTeam(e)}
            className="space-y-3"
            data-ocid={`setup.team${teamSlot}.form`}
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Team Name *
              </Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={teamSlot === 1 ? "e.g. Tigers" : "e.g. Lions"}
                required
                className="h-11 bg-input border-border/60"
                data-ocid={`setup.team${teamSlot}.name.input`}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Team Color
              </Label>
              <Select
                value={teamColor}
                onValueChange={(v) => setTeamColor(v as Color)}
              >
                <SelectTrigger
                  className="h-11 bg-input border-border/60"
                  data-ocid={`setup.team${teamSlot}.color.select`}
                >
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          selectedColorObj?.bg,
                        )}
                      />
                      {selectedColorObj?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", opt.bg)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={addTeamMutation.isPending || !teamName.trim()}
              className="w-full h-11 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              data-ocid={`setup.team${teamSlot}.add.button`}
            >
              {addTeamMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Team {teamSlot}
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            {/* Team info */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  COLOR_OPTIONS.find((c) => c.value === existingTeam.color)?.bg,
                )}
              />
              <span className="font-semibold text-foreground">
                {existingTeam.name}
              </span>
              <span className="text-muted-foreground ml-auto text-xs">
                {existingTeam.players.length} players
              </span>
            </div>

            {/* Players list */}
            {existingTeam.players.length > 0 && (
              <div className="space-y-1.5">
                {existingTeam.players.map((p, i) => (
                  <div
                    key={p.id.toString()}
                    data-ocid={`setup.team${teamSlot}.player.item.${i + 1}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono text-primary shrink-0">
                      {p.jerseyNumber.toString()}
                    </span>
                    <span className="text-foreground">{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add player form */}
            <form
              onSubmit={(e) => void handleAddPlayer(e)}
              className="space-y-2"
              data-ocid={`setup.team${teamSlot}.add_player.form`}
            >
              <Label className="text-xs font-medium text-muted-foreground">
                Add Player
              </Label>
              <div className="flex gap-2">
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1 h-10 bg-input border-border/60 text-sm"
                  data-ocid={`setup.team${teamSlot}.player_name.input`}
                />
                <div className="relative w-16">
                  <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    type="number"
                    value={jerseyNum}
                    onChange={(e) => setJerseyNum(e.target.value)}
                    placeholder="No"
                    min="0"
                    max="99"
                    className="pl-5 h-10 bg-input border-border/60 text-sm"
                    data-ocid={`setup.team${teamSlot}.jersey.input`}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={addPlayerMutation.isPending || !playerName.trim()}
                  size="sm"
                  className="h-10 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                  data-ocid={`setup.team${teamSlot}.add_player.button`}
                >
                  {addPlayerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function TeamSetupPage() {
  const { id } = useParams({ from: "/admin/match/$id/setup" });
  const matchId = BigInt(id);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: match, isLoading } = useGetMatch(matchId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            Please log in to access team setup
          </p>
        </main>
      </div>
    );
  }

  const team1 = match?.teams[0];
  const team2 = match?.teams[1];
  const canStart =
    team1 && team2 && team1.players.length >= 2 && team2.players.length >= 2;

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => void navigate({ to: "/admin" })}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          data-ocid="setup.back.button"
        >
          ← Dashboard
        </button>

        {/* Title */}
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-48 shimmer" />
          ) : (
            <h1 className="font-display font-black text-2xl text-foreground">
              {match?.name}
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            Add teams and players before starting
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl shimmer" />
            <Skeleton className="h-48 rounded-2xl shimmer" />
          </div>
        ) : match ? (
          <div className="space-y-4">
            <TeamSection matchId={matchId} teamSlot={1} existingTeam={team1} />
            <TeamSection matchId={matchId} teamSlot={2} existingTeam={team2} />

            {/* Start match */}
            <div className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">
                Ready to score?
              </h3>
              {!canStart && (
                <p className="text-xs text-muted-foreground">
                  Add both teams with at least 2 players each to start scoring
                </p>
              )}
              <Button
                disabled={!canStart}
                onClick={() =>
                  void navigate({
                    to: "/admin/match/$id/score",
                    params: { id: id },
                  })
                }
                className={cn(
                  "w-full h-12 font-semibold text-base",
                  canStart
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
                data-ocid="setup.start_scoring.button"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Scoring
              </Button>
            </div>
          </div>
        ) : (
          <div
            data-ocid="setup.error_state"
            className="text-center py-8 text-muted-foreground"
          >
            Match not found
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
