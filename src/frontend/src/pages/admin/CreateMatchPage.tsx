import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { useAuth } from "@/hooks/useAuth";
import { useCreateMatch } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, Plus, RefreshCw, Shield } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function CreateMatchPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { actor, isFetching: actorLoading } = useActor();
  const createMatch = useCreateMatch();

  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxOvers, setMaxOvers] = useState("");

  // Pending submit args for retry
  const pendingArgsRef = useRef<{
    name: string;
    date: bigint;
    maxOvers: bigint | null;
  } | null>(null);

  const isConnecting = actorLoading && !actor;
  // Button is only disabled if form is empty — no loading state shown
  const isButtonDisabled = !name.trim();

  const doSubmit = async (
    matchName: string,
    matchDate: bigint,
    overs: bigint | null,
  ) => {
    try {
      const matchId = await createMatch.mutateAsync({
        name: matchName,
        date: matchDate,
        maxOvers: overs,
      });
      toast.success("Match created!");
      void navigate({
        to: "/admin/match/$id/setup",
        params: { id: matchId.toString() },
      });
    } catch (err) {
      console.error(err);
      // error shown via createMatch.isError
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);
    const overs = maxOvers.trim() ? BigInt(maxOvers) : null;

    pendingArgsRef.current = {
      name: name.trim(),
      date: dateNs,
      maxOvers: overs,
    };
    await doSubmit(name.trim(), dateNs, overs);
  };

  const handleRetry = async () => {
    if (!pendingArgsRef.current) return;
    createMatch.reset();
    const { name: n, date: d, maxOvers: o } = pendingArgsRef.current;
    await doSubmit(n, d, o);
  };

  const getErrorMessage = () => {
    if (!createMatch.error) return null;
    const msg =
      createMatch.error instanceof Error
        ? createMatch.error.message
        : String(createMatch.error);
    if (msg.includes("timed out") || msg.includes("timeout"))
      return "The backend took too long to respond. Please check your connection and try again.";
    if (msg.includes("not ready") || msg.includes("Connecting"))
      return "Still connecting to backend — please wait a moment and try again.";
    if (msg.includes("Unauthorized") || msg.includes("403"))
      return "Authorization error. Please log out and back in.";
    // Show the actual error for easier debugging
    return msg.length > 10
      ? msg
      : "Connection failed. Please wait a moment and try again.";
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

        {isConnecting && (
          <div
            data-ocid="create_match.loading_state"
            className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 mb-4 text-sm text-primary/80 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-primary" />
            Connecting to backend — fill the form while this loads...
          </div>
        )}
        {!isConnecting && !actor && (
          <div
            data-ocid="create_match.loading_state"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 mb-4 text-sm text-destructive flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
            Backend not connected. Try refreshing the page.
          </div>
        )}

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
              {/* Quick-pick buttons */}
              <div className="flex gap-2 flex-wrap">
                {[5, 6, 8, 10, 15, 20].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() =>
                      setMaxOvers(maxOvers === o.toString() ? "" : o.toString())
                    }
                    className={cn(
                      "h-9 px-3 rounded-lg border text-sm font-mono font-bold transition-all",
                      maxOvers === o.toString()
                        ? "bg-primary/20 border-primary/60 text-primary"
                        : "bg-muted/50 border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                    data-ocid={`create_match.overs_${o}.button`}
                  >
                    {o}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMaxOvers("")}
                  className={cn(
                    "h-9 px-3 rounded-lg border text-sm font-semibold transition-all",
                    maxOvers === ""
                      ? "bg-muted/80 border-border text-foreground"
                      : "bg-muted/30 border-border/40 text-muted-foreground hover:border-border",
                  )}
                  data-ocid="create_match.overs_unlimited.button"
                >
                  Unlimited
                </button>
              </div>
              <Input
                id="max-overs"
                data-ocid="create_match.max_overs.input"
                type="number"
                min="1"
                max="50"
                value={maxOvers}
                onChange={(e) => setMaxOvers(e.target.value)}
                placeholder="or type custom overs..."
                className="h-12 bg-input border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for gully cricket with no fixed overs limit
              </p>
            </div>
          </div>

          {/* Error */}
          {createMatch.isError && (
            <div
              data-ocid="create_match.error_state"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 space-y-2"
            >
              <p className="text-sm text-destructive">{getErrorMessage()}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleRetry()}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 h-8 text-xs"
                data-ocid="create_match.retry.button"
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isButtonDisabled}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base box-glow-green"
            data-ocid="create_match.submit_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Match & Setup Teams
          </Button>
        </form>
      </main>

      <AppFooter />
    </div>
  );
}
