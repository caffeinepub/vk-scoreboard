import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, LogIn, LogOut, Shield } from "lucide-react";

interface AppHeaderProps {
  showAdminControls?: boolean;
}

export function AppHeader({ showAdminControls = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-sm sm:text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            VK<span className="text-primary">Scoreboard</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
