import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { useAuth } from "@/hooks/useAuth";
import { useCreateMatch } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, Loader2, Plus, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CreateMatchPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { isFetching } = useActor();
  const createMatch = useCreateMatch();

  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxOvers, setMaxOvers] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);
    const overs = maxOvers.trim() ? BigInt(maxOvers) : null;

    try {
      const matchId = await createMatch.mutateAsync({
        name: name.trim(),
        date: dateNs,
        maxOvers: overs,
      });
      toast.success("Match created!");
      void navigate({
        to: "/admin/match/$id/setup",
        params: { id: matchId.toString() },
      });
    } catch (err) {
      toast.error("Failed to create match");
      console.error(err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">
              Please log in to create a match
            </p>
            <Button
              onClick={() => void navigate({ to: "/admin/login" })}
              data-ocid="create_match.login.button"
            >
              Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => void navigate({ to: "/admin" })}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 flex items-center gap-1"
          data-ocid="create_match.back.button"
        >
          ← Dashboard
        </button>

        <h1 className="font-display font-black text-2xl text-foreground mb-6">
          Create New Match
        </h1>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div
            data-ocid="create_match.form"
            className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 space-y-5"
          >
            {/* Match name */}
            <div className="space-y-2">
              <Label
                htmlFor="match-name"
                className="text-sm font-semibold text-foreground"
              >
                Match Name *
              </Label>
              <Input
                id="match-name"
                data-ocid="create_match.name.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sector 14 vs Sector 21 — Final"
                required
                className="h-12 bg-input border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-primary/20"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label
                htmlFor="match-date"
                className="text-sm font-semibold text-foreground flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Match Date *
              </Label>
              <Input
                id="match-date"
                data-ocid="create_match.date.input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-12 bg-input border-border/60 text-foreground focus:border-primary/60 focus:ring-primary/20"
              />
            </div>

            {/* Max overs */}
            <div className="space-y-2">
              <Label
                htmlFor="max-overs"
                className="text-sm font-semibold text-foreground"
              >
                Max Overs{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="max-overs"
                data-ocid="create_match.max_overs.input"
                type="number"
                min="1"
                max="50"
                value={maxOvers}
                onChange={(e) => setMaxOvers(e.target.value)}
                placeholder="e.g. 10 — leave blank for unlimited"
                className="h-12 bg-input border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for gully cricket with no fixed overs limit
              </p>
            </div>
          </div>

          {/* Error */}
          {createMatch.isError && (
            <p
              data-ocid="create_match.error_state"
              className="text-sm text-destructive"
            >
              {createMatch.error instanceof Error &&
              createMatch.error.message.includes("not ready")
                ? "Still connecting to backend — please wait a moment and try again."
                : "Failed to create match. Please try again."}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={createMatch.isPending || !name.trim() || isFetching}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base box-glow-green"
            data-ocid="create_match.submit_button"
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : createMatch.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Match & Setup Teams
              </>
            )}
          </Button>
        </form>
      </main>

      <AppFooter />
    </div>
  );
}
