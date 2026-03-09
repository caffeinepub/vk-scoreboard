import { Color } from "@/backend.d";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useAddPlayer, useAddTeam, useCreateMatch } from "@/hooks/useQueries";
import {
  type Fixture,
  computePointsTable,
  useTournaments,
} from "@/hooks/useTournaments";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Award,
  ChevronLeft,
  Download,
  Edit2,
  ExternalLink,
  Loader2,
  Play,
  Plus,
  Save,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

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
    const raw = localStorage.getItem("vk_saved_teams");
    if (!raw) return [];
    return JSON.parse(raw) as SavedTeam[];
  } catch {
    return [];
  }
}

interface PlayerStatRecord {
  name: string;
  matches: number;
  runs: number;
  wickets: number;
  strikerate: number;
}

function getPlayerStats(): PlayerStatRecord[] {
  try {
    const raw = localStorage.getItem("vk_player_stats");
    if (!raw) return [];
    // vk_player_stats might be an array or object map; handle both
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PlayerStatRecord[];
    // If it's an object keyed by name
    return Object.values(parsed) as PlayerStatRecord[];
  } catch {
    return [];
  }
}

// ─── PDF Helper ───────────────────────────────────────────────────────────────

function printTournamentPDF(
  tournamentName: string,
  teams: string[],
  fixtures: Fixture[],
) {
  const standings = computePointsTable(fixtures);
  const playerStats = getPlayerStats();

  const standingsRows = standings
    .map(
      (s, i) =>
        `<tr style="background:${i === 0 ? "#f0fdf4" : "#fff"};">
        <td style="padding:6px 10px;font-weight:600;">${i + 1}. ${s.team}</td>
        <td style="padding:6px 8px;text-align:center;">${s.mp}</td>
        <td style="padding:6px 8px;text-align:center;color:#16a34a;font-weight:700;">${s.wins}</td>
        <td style="padding:6px 8px;text-align:center;color:#dc2626;">${s.losses}</td>
        <td style="padding:6px 8px;text-align:center;font-weight:800;color:#b45309;">${s.pts}</td>
      </tr>`,
    )
    .join("");

  const fixtureRows = fixtures
    .map(
      (f) =>
        `<tr>
        <td style="padding:6px 10px;font-weight:600;">${f.homeTeam}</td>
        <td style="padding:6px 8px;text-align:center;font-size:11px;color:#6b7280;">vs</td>
        <td style="padding:6px 10px;font-weight:600;">${f.awayTeam}</td>
        <td style="padding:6px 8px;text-align:center;font-family:monospace;">${f.homeScore ?? "—"}</td>
        <td style="padding:6px 8px;text-align:center;font-family:monospace;">${f.awayScore ?? "—"}</td>
        <td style="padding:6px 10px;color:${f.result ? "#16a34a" : "#6b7280"};font-size:12px;">${f.result ?? "Not played"}</td>
      </tr>`,
    )
    .join("");

  const playerRows = playerStats
    .slice(0, 20)
    .map(
      (p) =>
        `<tr>
        <td style="padding:6px 10px;font-weight:500;">${p.name}</td>
        <td style="padding:6px 8px;text-align:center;">${p.matches ?? 0}</td>
        <td style="padding:6px 8px;text-align:center;font-weight:700;">${p.runs ?? 0}</td>
        <td style="padding:6px 8px;text-align:center;color:#16a34a;font-weight:700;">${p.wickets ?? 0}</td>
        <td style="padding:6px 8px;text-align:center;">${(p.strikerate ?? 0).toFixed(1)}</td>
      </tr>`,
    )
    .join("");

  const html = `
    <div id="tournament-pdf" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#111;background:#fff;">
      <div style="border-bottom:3px solid #16a34a;padding-bottom:12px;margin-bottom:20px;">
        <h1 style="font-size:26px;font-weight:900;margin:0 0 4px;color:#111;">${tournamentName}</h1>
        <p style="margin:0;color:#6b7280;font-size:13px;">Tournament Report &bull; Generated ${new Date().toLocaleDateString()}</p>
      </div>

      <h2 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#374151;">Teams (${teams.length})</h2>
      <ul style="margin:0 0 20px;padding-left:20px;">
        ${teams.map((t) => `<li style="margin-bottom:4px;">${t}</li>`).join("")}
      </ul>

      <h2 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#374151;">Points Table</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px 10px;text-align:left;">Team</th>
          <th style="padding:8px 8px;text-align:center;">MP</th>
          <th style="padding:8px 8px;text-align:center;">W</th>
          <th style="padding:8px 8px;text-align:center;">L</th>
          <th style="padding:8px 8px;text-align:center;">Pts</th>
        </tr></thead>
        <tbody>${standingsRows}</tbody>
      </table>

      <h2 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#374151;">Match Results</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px 10px;text-align:left;">Home</th>
          <th style="padding:8px 8px;"></th>
          <th style="padding:8px 10px;text-align:left;">Away</th>
          <th style="padding:8px 8px;text-align:center;">H Score</th>
          <th style="padding:8px 8px;text-align:center;">A Score</th>
          <th style="padding:8px 10px;text-align:left;">Result</th>
        </tr></thead>
        <tbody>${fixtureRows}</tbody>
      </table>

      ${
        playerStats.length > 0
          ? `
      <h2 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#374151;">Player Statistics</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px 10px;text-align:left;">Player</th>
          <th style="padding:8px 8px;text-align:center;">M</th>
          <th style="padding:8px 8px;text-align:center;">Runs</th>
          <th style="padding:8px 8px;text-align:center;">Wkts</th>
          <th style="padding:8px 8px;text-align:center;">SR</th>
        </tr></thead>
        <tbody>${playerRows}</tbody>
      </table>`
          : ""
      }

      <p style="margin-top:24px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px;">Generated by VK Scoreboard &bull; caffeine.ai</p>
    </div>
  `;

  // Create a hidden iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(
    `<!DOCTYPE html><html><head><title>${tournamentName} – Tournament PDF</title><style>@page{margin:1cm}body{margin:0;padding:0}</style></head><body>${html}</body></html>`,
  );
  iframeDoc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TournamentDetailPage() {
  const { id } = useParams({ from: "/admin/tournament/$id" });
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { getTournament, updateFixture, addFixture, updateFixtureMatchId } =
    useTournaments();

  const createMatchMutation = useCreateMatch();
  const addTeamMutation = useAddTeam();
  const addPlayerMutation = useAddPlayer();

  // Edit fixture state
  const [editingFixture, setEditingFixture] = useState<string | null>(null);
  const [editHomeScore, setEditHomeScore] = useState("");
  const [editAwayScore, setEditAwayScore] = useState("");
  const [editResult, setEditResult] = useState("");

  // Add Match dialog
  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [newTeam1, setNewTeam1] = useState("");
  const [newTeam2, setNewTeam2] = useState("");

  // Start Tournament dialog
  const [fixturesPanelOpen, setFixturesPanelOpen] = useState(false);

  // Per-fixture setup loading
  const [setupLoading, setSetupLoading] = useState<Set<string>>(new Set());
  const setupLoadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoggedIn) void navigate({ to: "/admin/login" });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  const tournament = getTournament(id);

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader showAdminControls />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Tournament not found</p>
            <Button
              variant="outline"
              onClick={() => void navigate({ to: "/admin/tournaments" })}
            >
              Back to Tournaments
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const standings = computePointsTable(tournament.fixtures);
  const savedTeams = getSavedTeams();

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const startEditFixture = (fixture: Fixture) => {
    setEditingFixture(fixture.id);
    setEditHomeScore(fixture.homeScore ?? "");
    setEditAwayScore(fixture.awayScore ?? "");
    setEditResult(fixture.result ?? "");
  };

  const saveFixtureResult = (fixture: Fixture) => {
    updateFixture(tournament.id, {
      ...fixture,
      homeScore: editHomeScore || undefined,
      awayScore: editAwayScore || undefined,
      result: editResult || undefined,
    });
    setEditingFixture(null);
  };

  const cancelEdit = () => setEditingFixture(null);

  const handleAddMatch = () => {
    if (!newTeam1 || !newTeam2) {
      toast.error("Please select both teams");
      return;
    }
    if (newTeam1 === newTeam2) {
      toast.error("Team 1 and Team 2 must be different");
      return;
    }
    const fixture: Fixture = {
      id: Date.now().toString(),
      homeTeam: newTeam1,
      awayTeam: newTeam2,
    };
    addFixture(tournament.id, fixture);
    setNewTeam1("");
    setNewTeam2("");
    setAddMatchOpen(false);
    toast.success(`Match added: ${newTeam1} vs ${newTeam2}`);
  };

  const handleStartMatch = async (fixture: Fixture) => {
    const homeTeamData = savedTeams.find(
      (t) => t.name.toLowerCase() === fixture.homeTeam.toLowerCase(),
    );
    const awayTeamData = savedTeams.find(
      (t) => t.name.toLowerCase() === fixture.awayTeam.toLowerCase(),
    );

    if (!homeTeamData) {
      toast.error(
        `Team "${fixture.homeTeam}" not found in saved teams. Please create it in the Teams page first.`,
      );
      return;
    }
    if (!awayTeamData) {
      toast.error(
        `Team "${fixture.awayTeam}" not found in saved teams. Please create it in the Teams page first.`,
      );
      return;
    }

    // Mark fixture as loading
    setSetupLoading((prev) => {
      const next = new Set(prev);
      next.add(fixture.id);
      setupLoadingRef.current = next;
      return next;
    });

    try {
      // 1. Create the match
      const matchId = await createMatchMutation.mutateAsync({
        name: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
        date: BigInt(Date.now()),
        maxOvers: null,
      });

      // 2. Add home team and players
      const homeTeamId = await addTeamMutation.mutateAsync({
        matchId,
        teamName: homeTeamData.name,
        color: Color.blue,
      });
      for (const player of homeTeamData.players) {
        try {
          await addPlayerMutation.mutateAsync({
            matchId,
            teamId: homeTeamId,
            playerName: player.name,
            jerseyNumber: BigInt(player.jerseyNumber),
          });
        } catch {
          // continue even if individual player fails
        }
      }

      // 3. Add away team and players
      const awayTeamId = await addTeamMutation.mutateAsync({
        matchId,
        teamName: awayTeamData.name,
        color: Color.red,
      });
      for (const player of awayTeamData.players) {
        try {
          await addPlayerMutation.mutateAsync({
            matchId,
            teamId: awayTeamId,
            playerName: player.name,
            jerseyNumber: BigInt(player.jerseyNumber),
          });
        } catch {
          // continue even if individual player fails
        }
      }

      // 4. Save matchId to fixture
      updateFixtureMatchId(tournament.id, fixture.id, matchId.toString());

      toast.success("Match setup complete! Opening scoring page…");

      // 5. Navigate to scoring page
      void navigate({
        to: "/admin/match/$id/score",
        params: { id: matchId.toString() },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to set up match: ${msg}`);
    } finally {
      setSetupLoading((prev) => {
        const next = new Set(prev);
        next.delete(fixture.id);
        setupLoadingRef.current = next;
        return next;
      });
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => void navigate({ to: "/admin/tournaments" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="tournament.back.button"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Tournaments
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="w-7 h-7 text-cricket-gold shrink-0" />
              <h1 className="font-display font-black text-2xl text-foreground">
                {tournament.name}
              </h1>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  printTournamentPDF(
                    tournament.name,
                    tournament.teams,
                    tournament.fixtures,
                  )
                }
                className="border-border/50 text-muted-foreground hover:text-foreground text-xs gap-1.5"
                data-ocid="tournament.download_pdf.button"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setFixturesPanelOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5"
                data-ocid="tournament.start_tournament.button"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Tournament</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>{tournament.teams.length} teams</span>
            <span>·</span>
            <span>{tournament.fixtures.length} fixtures</span>
            <span>·</span>
            <span>
              {tournament.fixtures.filter((f) => f.result).length} completed
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tournament.teams.map((team) => (
              <span
                key={team}
                className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium"
              >
                {team}
              </span>
            ))}
          </div>
        </div>

        {/* Points Table */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="px-3 py-2 border-b border-border/20 bg-muted/30 flex items-center gap-2">
            <Award className="w-4 h-4 text-cricket-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Points Table
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/10 bg-muted/10">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">
                    Team
                  </th>
                  <th className="text-right px-2 py-2.5 text-xs font-medium text-muted-foreground">
                    MP
                  </th>
                  <th className="text-right px-2 py-2.5 text-xs font-medium text-muted-foreground">
                    W
                  </th>
                  <th className="text-right px-2 py-2.5 text-xs font-medium text-muted-foreground">
                    L
                  </th>
                  <th className="text-right px-2 py-2.5 text-xs font-medium text-muted-foreground">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-muted-foreground"
                    >
                      No results yet
                    </td>
                  </tr>
                ) : (
                  standings.map((s, i) => (
                    <tr
                      key={s.team}
                      data-ocid={`tournament.standings.item.${i + 1}`}
                      className={`border-b border-border/10 last:border-0 ${
                        i === 0 ? "bg-cricket-gold/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          {i === 0 && s.pts > 0 && (
                            <Trophy className="w-3.5 h-3.5 text-cricket-gold shrink-0" />
                          )}
                          {s.team}
                        </div>
                      </td>
                      <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                        {s.mp}
                      </td>
                      <td className="text-right px-2 py-2.5 font-mono text-neon-green font-bold">
                        {s.wins}
                      </td>
                      <td className="text-right px-2 py-2.5 font-mono text-wicket-red">
                        {s.losses}
                      </td>
                      <td className="text-right px-2 py-2.5 font-mono font-black text-cricket-gold">
                        {s.pts}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fixtures */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Fixtures ({tournament.fixtures.length})
            </h2>
            <Button
              size="sm"
              onClick={() => setAddMatchOpen(true)}
              className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs gap-1"
              data-ocid="tournament.add_match.button"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Match
            </Button>
          </div>

          {tournament.fixtures.length === 0 ? (
            <div
              data-ocid="tournament.fixtures.empty_state"
              className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-8 text-center space-y-2"
            >
              <p className="text-sm text-muted-foreground">
                No fixtures yet. Click &ldquo;Add Match&rdquo; to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tournament.fixtures.map((fixture, i) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  index={i}
                  tournamentId={tournament.id}
                  isEditing={editingFixture === fixture.id}
                  isSetupLoading={setupLoading.has(fixture.id)}
                  editHomeScore={editHomeScore}
                  editAwayScore={editAwayScore}
                  editResult={editResult}
                  onEditHomeScore={setEditHomeScore}
                  onEditAwayScore={setEditAwayScore}
                  onEditResult={setEditResult}
                  onStartEdit={startEditFixture}
                  onSave={saveFixtureResult}
                  onCancel={cancelEdit}
                  onStartMatch={handleStartMatch}
                  onNavigateToMatch={(matchId) =>
                    void navigate({
                      to: "/admin/match/$id/score",
                      params: { id: matchId },
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AppFooter />

      {/* Add Match Dialog */}
      <Dialog open={addMatchOpen} onOpenChange={setAddMatchOpen}>
        <DialogContent
          className="bg-card border-border/50 max-w-sm"
          data-ocid="tournament.add_match.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              Add Match
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Select two saved teams to create a fixture.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {savedTeams.length < 2 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                You need at least 2 saved teams. Go to the Admin Dashboard to
                create teams first.
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Team 1
                  </p>
                  <Select value={newTeam1} onValueChange={setNewTeam1}>
                    <SelectTrigger
                      className="bg-input border-border/60"
                      data-ocid="tournament.add_match.team1.select"
                    >
                      <SelectValue placeholder="Select Team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedTeams.map((t) => (
                        <SelectItem
                          key={t.id}
                          value={t.name}
                          disabled={t.name === newTeam2}
                        >
                          {t.name}
                          {t.players.length > 0 &&
                            ` (${t.players.length} players)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Team 2
                  </p>
                  <Select value={newTeam2} onValueChange={setNewTeam2}>
                    <SelectTrigger
                      className="bg-input border-border/60"
                      data-ocid="tournament.add_match.team2.select"
                    >
                      <SelectValue placeholder="Select Team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedTeams.map((t) => (
                        <SelectItem
                          key={t.id}
                          value={t.name}
                          disabled={t.name === newTeam1}
                        >
                          {t.name}
                          {t.players.length > 0 &&
                            ` (${t.players.length} players)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setAddMatchOpen(false)}
              data-ocid="tournament.add_match.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMatch}
              disabled={!newTeam1 || !newTeam2 || newTeam1 === newTeam2}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="tournament.add_match.confirm_button"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Fixture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Tournament – Fixtures Panel */}
      <Dialog open={fixturesPanelOpen} onOpenChange={setFixturesPanelOpen}>
        <DialogContent
          className="bg-card border-border/50 max-w-2xl w-full"
          data-ocid="tournament.fixtures_panel.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cricket-gold" />
              {tournament.name} — All Fixtures
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {tournament.fixtures.length} fixture
              {tournament.fixtures.length !== 1 ? "s" : ""} &bull;{" "}
              {tournament.fixtures.filter((f) => f.result).length} completed
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
            {tournament.fixtures.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">
                No fixtures yet. Close this panel and click &ldquo;Add
                Match&rdquo;.
              </p>
            ) : (
              tournament.fixtures.map((fixture, i) => (
                <div
                  key={fixture.id}
                  data-ocid={`tournament.panel.fixture.item.${i + 1}`}
                  className={`rounded-xl border p-4 flex items-center gap-3 ${
                    fixture.result
                      ? "border-neon-green/20 bg-neon-green/5"
                      : "border-border/40 bg-muted/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="truncate">{fixture.homeTeam}</span>
                      <span className="text-muted-foreground/50 shrink-0">
                        vs
                      </span>
                      <span className="truncate">{fixture.awayTeam}</span>
                    </div>
                    {(fixture.homeScore || fixture.awayScore) && (
                      <div className="mt-0.5 text-xs font-mono text-muted-foreground">
                        {fixture.homeScore} — {fixture.awayScore}
                      </div>
                    )}
                    {fixture.result && (
                      <div className="mt-1 text-xs text-neon-green font-medium">
                        ✓ {fixture.result}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {fixture.result ? (
                      <Badge className="bg-neon-green/10 text-neon-green border-neon-green/20 text-xs">
                        Done
                      </Badge>
                    ) : fixture.matchId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFixturesPanelOpen(false);
                          void navigate({
                            to: "/admin/match/$id/score",
                            params: { id: fixture.matchId! },
                          });
                        }}
                        className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                        data-ocid={`tournament.panel.fixture.view_button.${i + 1}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Match
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setFixturesPanelOpen(false);
                          void handleStartMatch(fixture);
                        }}
                        disabled={setupLoading.has(fixture.id)}
                        className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        data-ocid={`tournament.panel.fixture.start_button.${i + 1}`}
                      >
                        {setupLoading.has(fixture.id) ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Setting up…
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Start Match
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setFixturesPanelOpen(false)}
              data-ocid="tournament.fixtures_panel.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Fixture Card Component ───────────────────────────────────────────────────

function FixtureCard({
  fixture,
  index,
  isEditing,
  isSetupLoading,
  editHomeScore,
  editAwayScore,
  editResult,
  onEditHomeScore,
  onEditAwayScore,
  onEditResult,
  onStartEdit,
  onSave,
  onCancel,
  onStartMatch,
  onNavigateToMatch,
}: {
  fixture: Fixture;
  index: number;
  tournamentId: string;
  isEditing: boolean;
  isSetupLoading: boolean;
  editHomeScore: string;
  editAwayScore: string;
  editResult: string;
  onEditHomeScore: (v: string) => void;
  onEditAwayScore: (v: string) => void;
  onEditResult: (v: string) => void;
  onStartEdit: (f: Fixture) => void;
  onSave: (f: Fixture) => void;
  onCancel: () => void;
  onStartMatch: (f: Fixture) => Promise<void>;
  onNavigateToMatch: (matchId: string) => void;
}) {
  return (
    <div
      data-ocid={`tournament.fixture.item.${index + 1}`}
      className={`rounded-xl border ${
        fixture.result
          ? "border-neon-green/20 bg-neon-green/5"
          : "border-border/40 bg-card"
      } p-4 space-y-3`}
    >
      {isEditing ? (
        /* Edit form */
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {fixture.homeTeam} vs {fixture.awayTeam}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {fixture.homeTeam} score
              </p>
              <Input
                value={editHomeScore}
                onChange={(e) => onEditHomeScore(e.target.value)}
                placeholder="e.g. 120/4"
                className="h-9 bg-input border-border/60 text-sm"
                data-ocid="tournament.fixture.home_score.input"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {fixture.awayTeam} score
              </p>
              <Input
                value={editAwayScore}
                onChange={(e) => onEditAwayScore(e.target.value)}
                placeholder="e.g. 115/6"
                className="h-9 bg-input border-border/60 text-sm"
                data-ocid="tournament.fixture.away_score.input"
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Result (include team name for points)
            </p>
            <Input
              value={editResult}
              onChange={(e) => onEditResult(e.target.value)}
              placeholder={`e.g. ${fixture.homeTeam} won by 5 runs`}
              className="h-9 bg-input border-border/60 text-sm"
              data-ocid="tournament.fixture.result.input"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onSave(fixture)}
              className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30"
              data-ocid="tournament.fixture.save.button"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="text-muted-foreground"
              data-ocid="tournament.fixture.cancel.button"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* Display */
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="truncate">{fixture.homeTeam}</span>
              <span className="text-muted-foreground/50 shrink-0">vs</span>
              <span className="truncate">{fixture.awayTeam}</span>
            </div>
            {(fixture.homeScore || fixture.awayScore) && (
              <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-muted-foreground">
                {fixture.homeScore && (
                  <span className="font-bold text-foreground">
                    {fixture.homeScore}
                  </span>
                )}
                {fixture.homeScore && fixture.awayScore && <span>—</span>}
                {fixture.awayScore && (
                  <span className="font-bold text-foreground">
                    {fixture.awayScore}
                  </span>
                )}
              </div>
            )}
            {fixture.result && (
              <div className="mt-1 text-xs text-neon-green font-medium">
                ✓ {fixture.result}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Start / View match button */}
            {!fixture.result && !fixture.matchId && (
              <Button
                size="sm"
                onClick={() => void onStartMatch(fixture)}
                disabled={isSetupLoading}
                className="text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid={`tournament.fixture.start_button.${index + 1}`}
              >
                {isSetupLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Start
                  </>
                )}
              </Button>
            )}
            {fixture.matchId && !fixture.result && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateToMatch(fixture.matchId!)}
                className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                data-ocid={`tournament.fixture.view_button.${index + 1}`}
              >
                <ExternalLink className="w-3 h-3" />
                View
              </Button>
            )}
            {/* Edit button */}
            <button
              type="button"
              onClick={() => onStartEdit(fixture)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all shrink-0"
              data-ocid={`tournament.fixture.edit_button.${index + 1}`}
              title="Edit fixture result"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
