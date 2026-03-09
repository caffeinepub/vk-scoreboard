# VK Scoreboard – Tournament Page Multi-Match & PDF Export

## Current State
- `TournamentDetailPage.tsx` shows tournament fixtures (auto-generated round-robin from teams), points table, and allows manual editing of fixture results (scores, result text).
- `useTournaments.ts` stores tournaments in localStorage. `computePointsTable` calculates standings from fixture results.
- Fixtures are auto-generated at tournament creation (round-robin from team list). There is no way to manually add new fixtures afterward.
- No "Start Tournament" button or "Start Match" integration with live scoring.
- No link between tournament fixtures and actual backend cricket matches (the `matchId` field in `Fixture` exists but is never set or used).
- Saved teams live in `localStorage` under key `vk_saved_teams` (managed by `AdminDashboardPage`). Each team has `{ id, name, players: [{id, name, jerseyNumber}] }`.
- `TeamSetupPage` accepts a `matchId` and auto-creates teams/players via backend mutations (`addTeam`, `addPlayer`).
- Navigation to live scoring is `/admin/match/$id/score`.
- Points table only updates when fixture `result` string is manually edited.
- No PDF download functionality on the tournament page.

## Requested Changes (Diff)

### Add
- **"+  Add Match" button** inside the Fixtures section of `TournamentDetailPage`. Opens a dialog to select Team 1 and Team 2 from saved teams (loaded from `vk_saved_teams` localStorage). Creates a new fixture and adds it to the tournament's fixture list immediately.
- **"Start Tournament" button** at the top of `TournamentDetailPage` (visible when there are fixtures). Shows all fixtures in a modal/panel; each fixture has a "Start Match" button.
- **"Start Match" flow**: clicking "Start Match" on a fixture:
  1. Creates a backend match via `createMatch` mutation.
  2. Auto-creates both teams and all their players via `addTeam` + `addPlayer` mutations using the saved team data (looked up from `vk_saved_teams`).
  3. Stores the resulting backend `matchId` into the fixture's `matchId` field.
  4. Navigates to `/admin/match/$id/score` (skip team setup entirely).
- **Auto Points Table update**: After a live match ends, the result is written back to the tournament fixture. Detect completed matches by polling the backend match state or by a "Save Result to Tournament" button on the result screen. The simpler path: add a callback/hook so when `LiveScoringPage` completes the match and the user views the result, a "Save to Tournament" option appears if the match was started from a tournament fixture. Alternatively, detect via `matchId` in the fixture and read the result from localStorage match session.
- **"Download Tournament PDF" button** on `TournamentDetailPage`. Generates a clean print-ready PDF (using `window.print()` with a print-specific hidden div, or `jsPDF`/`html2canvas`) containing:
  - Tournament Name
  - Teams List
  - Points Table (MP, W, L, Pts)
  - Match Results (each fixture with scores and result)
  - Player Statistics (from `vk_player_stats` localStorage if available)
- **addFixture function** in `useTournaments` hook to add a single fixture to an existing tournament.
- **updateFixtureMatchId function** in `useTournaments` to link a fixture to a backend matchId after starting.

### Modify
- `useTournaments.ts`: add `addFixture(tournamentId, fixture)` and `updateFixtureMatchId(tournamentId, fixtureId, matchId)` methods.
- `TournamentDetailPage.tsx`: 
  - Add "+ Add Match" button in Fixtures section header.
  - Add "Start Tournament" button in the page header area.
  - Fixtures display: show "Start Match" button for fixtures without a matchId, and "View Match" button for those that have one.
  - Points Table: recalculate in real-time from fixture results (already done via `computePointsTable`).
  - Add "Download PDF" button in the page header area.
- When a saved team is used to start a match from a tournament, skip `TeamSetupPage` entirely by pre-creating teams/players before navigating to the score page.

### Remove
- Nothing removed.

## Implementation Plan
1. Extend `useTournaments` hook: add `addFixture` and `updateFixtureMatchId` functions.
2. Update `TournamentDetailPage`:
   a. Add "+ Add Match" dialog: loads `vk_saved_teams` from localStorage, shows two selects for Team 1 / Team 2, on confirm calls `addFixture`.
   b. Add "Start Tournament" panel/modal at top showing all fixtures with "Start Match" buttons.
   c. "Start Match" logic: call `createMatch` → `addTeam` × 2 → `addPlayer` × N → call `updateFixtureMatchId` → navigate to `/admin/match/$id/score`.
   d. Fixture rows: show status badge (Not Started / In Progress / Completed), "Start Match" / "View Match" buttons.
   e. Add "Download Tournament PDF" button: renders a hidden print div with tournament data and calls `window.print()` with `@media print` CSS, or uses a simple `jsPDF` inline approach.
3. Ensure points table auto-reflects any fixture result changes (already reactive since `computePointsTable` runs on every render from fixture data).
4. Add `data-ocid` markers to all new interactive elements.
