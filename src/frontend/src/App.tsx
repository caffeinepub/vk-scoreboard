import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { MatchListPage } from "@/pages/MatchListPage";
import { PublicScoreboardPage } from "@/pages/PublicScoreboardPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { BallCorrectionPage } from "@/pages/admin/BallCorrectionPage";
import { CreateMatchPage } from "@/pages/admin/CreateMatchPage";
import { LiveScoringPage } from "@/pages/admin/LiveScoringPage";
import { TeamSetupPage } from "@/pages/admin/TeamSetupPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// ─── Root route ───────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.14 0.02 250)",
            border: "1px solid oklch(0.28 0.03 248)",
            color: "oklch(0.97 0.005 200)",
          },
        }}
      />
    </>
  ),
});

// ─── Public routes ────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MatchListPage,
});

const matchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/match/$id",
  component: PublicScoreboardPage,
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboardPage,
});

const createMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/match/create",
  component: CreateMatchPage,
});

const teamSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/match/$id/setup",
  component: TeamSetupPage,
});

const liveScoringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/match/$id/score",
  component: LiveScoringPage,
});

const ballCorrectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/match/$id/correct",
  component: BallCorrectionPage,
});

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  matchRoute,
  adminLoginRoute,
  adminDashboardRoute,
  createMatchRoute,
  teamSetupRoute,
  liveScoringRoute,
  ballCorrectionRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
