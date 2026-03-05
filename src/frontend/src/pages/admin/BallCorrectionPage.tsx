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
import { useAuth } from "@/hooks/useAuth";
import { DismissalType, ExtrasType } from "@/hooks/useCricketScoring";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertTriangle, Edit2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BallCorrectionPage() {
  const { id } = useParams({ from: "/admin/match/$id/correct" });
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [overNumber, setOverNumber] = useState("");
  const [ballNumber, setBallNumber] = useState("");
  const [runs, setRuns] = useState("0");
  const [extrasType, setExtrasType] = useState<ExtrasType>(ExtrasType.none);
  const [isWicket, setIsWicket] = useState(false);
  const [dismissalType, setDismissalType] = useState<DismissalType>(
    DismissalType.bowled,
  );

  const handleSave = () => {
    toast.success("Ball correction saved (session only — refresh resets)");
    void navigate({ to: "/admin/match/$id/score", params: { id } });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col pitch-bg">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please log in</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      <AppHeader showAdminControls />

      <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <button
          type="button"
          onClick={() =>
            void navigate({ to: "/admin/match/$id/score", params: { id } })
          }
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          data-ocid="correct.back.button"
        >
          ← Back to Scoring
        </button>

        <div className="flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-primary" />
          <h1 className="font-display font-black text-2xl text-foreground">
            Correct a Ball
          </h1>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 text-sm bg-noball-orange/10 border border-noball-orange/30 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-noball-orange mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-noball-orange">
              Session-only correction
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Ball corrections are applied to the local scoring session. They
              will be lost on page refresh.
            </p>
          </div>
        </div>

        <div
          data-ocid="correct.form"
          className="rounded-2xl border border-border/50 bg-card p-5 space-y-5"
        >
          {/* Over / Ball selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Over Number
              </Label>
              <Input
                type="number"
                min="1"
                value={overNumber}
                onChange={(e) => setOverNumber(e.target.value)}
                placeholder="e.g. 3"
                className="h-11 bg-input border-border/60"
                data-ocid="correct.over.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Ball Number
              </Label>
              <Input
                type="number"
                min="1"
                max="6"
                value={ballNumber}
                onChange={(e) => setBallNumber(e.target.value)}
                placeholder="e.g. 4"
                className="h-11 bg-input border-border/60"
                data-ocid="correct.ball.input"
              />
            </div>
          </div>

          {/* Runs */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Runs
            </Label>
            <div className="grid grid-cols-7 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRuns(r.toString())}
                  className={`h-11 rounded-xl border font-mono font-bold text-lg transition-all ${
                    runs === r.toString()
                      ? "bg-primary/20 border-primary/60 text-primary"
                      : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border"
                  }`}
                  data-ocid={`correct.runs_${r}.button`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Extras type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Extras Type
            </Label>
            <Select
              value={extrasType}
              onValueChange={(v) => setExtrasType(v as ExtrasType)}
            >
              <SelectTrigger
                className="h-11 bg-input border-border/60"
                data-ocid="correct.extras.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExtrasType.none}>None</SelectItem>
                <SelectItem value={ExtrasType.wide}>Wide</SelectItem>
                <SelectItem value={ExtrasType.noball}>No Ball</SelectItem>
                <SelectItem value={ExtrasType.bye}>Bye</SelectItem>
                <SelectItem value={ExtrasType.legbye}>Leg Bye</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wicket */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsWicket(!isWicket)}
                className={`w-11 h-6 rounded-full border-2 transition-all ${
                  isWicket
                    ? "bg-wicket-red/40 border-wicket-red"
                    : "bg-muted border-border/60"
                }`}
                data-ocid="correct.wicket.toggle"
              >
                <span
                  className={`block w-4 h-4 rounded-full transition-all mx-0.5 ${
                    isWicket
                      ? "bg-wicket-red translate-x-5"
                      : "bg-muted-foreground/60"
                  }`}
                />
              </button>
              <Label className="text-sm font-medium text-foreground">
                Is Wicket
              </Label>
            </div>
          </div>

          {isWicket && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Dismissal Type
              </Label>
              <Select
                value={dismissalType}
                onValueChange={(v) => setDismissalType(v as DismissalType)}
              >
                <SelectTrigger
                  className="h-11 bg-input border-border/60"
                  data-ocid="correct.dismissal.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.values(DismissalType) as DismissalType[]).map(
                    (dt) => (
                      <SelectItem key={dt} value={dt}>
                        {dt === "hitwicket"
                          ? "Hit Wicket"
                          : dt === "runout"
                            ? "Run Out"
                            : dt.charAt(0).toUpperCase() + dt.slice(1)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleSave}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold box-glow-green"
            data-ocid="correct.save.button"
          >
            <Save className="w-4 h-4 mr-2" />
            Apply Correction
          </Button>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
