import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  History,
  LogIn,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

interface AppHeaderProps {
  showAdminControls?: boolean;
}

export function AppHeader({ showAdminControls = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();

  const themeIcon =
    theme === "dark" ? (
      <Moon className="w-4 h-4" />
    ) : theme === "neon" ? (
      <Zap className="w-4 h-4 text-neon-green" />
    ) : (
      <Sun className="w-4 h-4 text-cricket-gold" />
    );

  const themeLabel =
    theme === "dark" ? "Dark" : theme === "neon" ? "Neon" : "Light";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md no-print">
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-sm sm:text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            VK<span className="text-primary">Scoreboard</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          <Link
            to="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            data-ocid="nav.history.link"
          >
            <History className="w-4 h-4" />
            History
          </Link>
          {isLoggedIn && (
            <>
              <Link
                to="/admin/tournaments"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                data-ocid="nav.tournaments.link"
              >
                <Trophy className="w-4 h-4" />
                Tournaments
              </Link>
              <Link
                to="/admin/players"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                data-ocid="nav.players.link"
              >
                <Users className="w-4 h-4" />
                Players
              </Link>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleTheme}
            className="text-muted-foreground hover:text-foreground w-9 px-0"
            title={`Theme: ${themeLabel}`}
            data-ocid="nav.theme.toggle"
          >
            {themeIcon}
          </Button>

          {/* Mobile history link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ to: "/history" })}
            className="md:hidden text-muted-foreground hover:text-foreground w-9 px-0"
            data-ocid="nav.history.button"
            title="Match History"
          >
            <History className="w-4 h-4" />
          </Button>

          {showAdminControls && isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void navigate({ to: "/admin" })}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="nav.admin_dashboard.link"
            >
              <Shield className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          )}

          {isLoggedIn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                void navigate({ to: "/" });
              }}
              className="border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              data-ocid="nav.logout.button"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void navigate({ to: "/admin/login" })}
              className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
              data-ocid="nav.admin_login.button"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
