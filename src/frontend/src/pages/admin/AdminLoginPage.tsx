import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      void navigate({ to: "/admin" });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Small delay for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 300));

    const success = login(username.trim(), password);
    if (success) {
      void navigate({ to: "/admin" });
    } else {
      setError("Invalid username or password. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pitch-bg pitch-texture">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-sm sm:text-base tracking-tight">
              VK<span className="text-primary">Scoreboard</span>
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Icon */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 box-glow-green">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display font-black text-2xl text-foreground tracking-tight">
              Admin Login
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Sign in to manage matches and score balls
            </p>
          </div>

          {/* Login card */}
          <div
            data-ocid="admin_login.card"
            className="rounded-2xl border border-border/50 bg-card p-6 space-y-5"
          >
            {/* Error message */}
            {error && (
              <div
                data-ocid="admin_login.error_state"
                className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5 border border-destructive/20"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-4"
              data-ocid="admin_login.form"
            >
              {/* Username */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-sm font-semibold text-foreground"
                >
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="username"
                    data-ocid="admin_login.username.input"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                    className="pl-10 h-12 bg-input border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    data-ocid="admin_login.password.input"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    className="pl-10 h-12 bg-input border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-primary/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 text-base box-glow-green"
                data-ocid="admin_login.submit_button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Back link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="admin_login.cancel_button"
            >
              ← Back to matches
            </button>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
