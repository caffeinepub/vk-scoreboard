import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  type Fixture,
  computePointsTable,
  useTournaments,
} from "@/hooks/useTournaments";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Award, ChevronLeft, Edit2, Save, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

export function TournamentDetailPage() {
  const { id } = useParams({ from: "/admin/tournament/$id" });
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { getTournament, updateFixture } = useTournaments();

  const [editingFixture, setEditingFixture] = useState<string | null>(null);
  const [editHomeScore, setEditHomeScore] = useState("");
  const [editAwayScore, setEditAwayScore] = useState("");
  const [editResult, setEditResult] = useState("");

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

  const startEditFixture = (fixture: Fixture) => {
    setEditingFixture(fixture.id);
    setEditHomeScore(fixture.homeScore ?? "");
    setEditAwayScore(fixture.awayScore ?? "");
    setEditResult(fixture.result ?? "");
  };

  const saveFixture = (fixture: Fixture) => {
    updateFixture(tournament.id, {
      ...fixture,
      homeScore: editHomeScore || undefined,
      awayScore: editAwayScore || undefined,
      result: editResult || undefined,
    });
    setEditingFixture(null);
  };

  const cancelEdit = () => setEditingFixture(null);

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
        <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-2">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-cricket-gold" />
            <h1 className="font-display font-black text-2xl text-foreground">
              {tournament.name}
            </h1>
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
          <div className="flex flex-wrap gap-2 pt-1">
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
                {standings.map((s, i) => (
                  <tr
                    key={s.team}
                    data-ocid={`tournament.standings.item.${i + 1}`}
                    className={`border-b border-border/10 last:border-0 ${i === 0 ? "bg-cricket-gold/5" : ""}`}
                  >
                    <td className="px-3 py-2.5 font-semibold text-foreground flex items-center gap-2">
                      {i === 0 && s.pts > 0 && (
                        <Trophy className="w-3.5 h-3.5 text-cricket-gold shrink-0" />
                      )}
                      {s.team}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fixtures */}
        <div className="space-y-2">
          <h2 className="font-display font-bold text-base text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Fixtures ({tournament.fixtures.length})
          </h2>
          <div className="space-y-2">
            {tournament.fixtures.map((fixture, i) => (
              <div
                key={fixture.id}
                data-ocid={`tournament.fixture.item.${i + 1}`}
                className={`rounded-xl border ${fixture.result ? "border-neon-green/20 bg-neon-green/5" : "border-border/40 bg-card"} p-4 space-y-3`}
              >
                {editingFixture === fixture.id ? (
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
                          onChange={(e) => setEditHomeScore(e.target.value)}
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
                          onChange={(e) => setEditAwayScore(e.target.value)}
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
                        onChange={(e) => setEditResult(e.target.value)}
                        placeholder={`e.g. ${fixture.homeTeam} won by 5 runs`}
                        className="h-9 bg-input border-border/60 text-sm"
                        data-ocid="tournament.fixture.result.input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveFixture(fixture)}
                        className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30"
                        data-ocid="tournament.fixture.save.button"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
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
                        <span className="text-muted-foreground/50 shrink-0">
                          vs
                        </span>
                        <span className="truncate">{fixture.awayTeam}</span>
                      </div>
                      {(fixture.homeScore || fixture.awayScore) && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-muted-foreground">
                          {fixture.homeScore && (
                            <span className="font-bold text-foreground">
                              {fixture.homeScore}
                            </span>
                          )}
                          {fixture.homeScore && fixture.awayScore && (
                            <span>—</span>
                          )}
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
                    <button
                      type="button"
                      onClick={() => startEditFixture(fixture)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all shrink-0"
                      data-ocid={`tournament.fixture.edit_button.${i + 1}`}
                      title="Edit fixture result"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
