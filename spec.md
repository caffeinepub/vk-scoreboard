# VK Scoreboard

## Current State

A full-stack gully cricket scoring app with:
- Backend: Motoko actor with `createMatch`, `addTeam`, `addPlayer`, `deleteMatch`, `rematch`, `saveInningsResult`, `getMatch`, `listMatches`
- Frontend: React/TypeScript SPA with admin login (username/password), match creation, team setup, live ball-by-ball scoring, public scoreboard
- Features already built: toss screen, innings tracking, over summaries, fall of wickets, ball-by-ball history, score graph, QR share, commentary, player-of-match, match highlights, match history with bulk delete, tournaments, player profiles

## Requested Changes (Diff)

### Add
- Player statistics system: after each innings ends, update each player's aggregate stats (runs, balls, 4s, 6s, wickets, overs bowled, runs conceded) in the backend
- Team statistics system: after each match completes, update team aggregate stats (matches played, wins, losses, runs scored, wickets taken)
- Separate `savePlayerStats` and `saveTeamStats` backend APIs to persist post-match stats
- Delete button in Match History page (per-card, not just bulk)
- PDF download: fix the print/PDF scorecard to include full batting + bowling scorecard properly
- System stability: ensure data is saved correctly and not lost after refresh (already handled by localStorage + backend sync, but improve rematch null-safety)

### Modify
- **Rematch fix**: The `rematch` function in backend creates new teams/players but the frontend `handleRematch` navigates to the new match's score page too fast before the match data is loaded. Add a guard — after navigating, wait for match data (team/players) before starting the toss screen. Also ensure the `battingTeamIndex` prop is propagated for the rematch SetupScreen.
- **Auto team rotation fix**: After innings 1 ends, innings 2 should automatically show the bowling team (team 2 in toss order) as the batting team. This is already implemented via `SetupScreen`'s `battingTeamIndex` prop swap, but the `tossBattingTeamIndex` is not preserved after `handleStart2ndInnings`. Ensure `tossBattingTeamIndex` state is kept when transitioning to innings 2.
- **PDF/Print scorecard**: The print button currently calls `window.print()`. Improve the print stylesheet so the scorecard renders clearly — include match name, both innings batting/bowling stats, extras, result.
- **Player stats page**: Update `PlayerProfilesPage` to show aggregated stats pulled from player objects in all completed matches.
- **Team stats**: Show team win/loss aggregates on player profiles page or a separate team stats panel.
- **Match History delete per card**: Add individual delete button to each MatchHistoryCard (not just the bulk-select mode that already exists).

### Remove
- Nothing removed.

## Implementation Plan

1. **Backend**: Add `savePlayerStats` and `saveTeamStats` APIs to persist aggregate player/team stats after each match. Add a `PlayerAggregateStats` and `TeamAggregateStats` type and maps.
2. **Frontend - Rematch crash fix**: In `LiveScoringPage`, after `rematch` succeeds, navigate to the new match's toss screen. The new match will have the same teams/players. Add null-safety guards for `match.teams[0]` and `match.teams[1]` throughout.
3. **Frontend - Team rotation**: Ensure `tossBattingTeamIndex` is properly forwarded to innings 2 setup. The `SetupScreen` already swaps batting/bowling teams for innings 2 using `propBattingTeamIndex`. Verify the value is passed correctly.
4. **Frontend - Player stats**: After `saveInningsResult` for the 2nd innings (match complete), call `savePlayerStats` for each player with their innings stats from localStorage.
5. **Frontend - PDF print**: Enhance the print CSS so clicking the print button produces a clean scorecard. The `FinalResultScreen` and `InningsBattingSummary` components are already rendered in `LiveScoringPage` and marked `no-print` for action buttons. Ensure print styles show full batting/bowling tables.
6. **Frontend - History delete per card**: Add per-card delete button to `MatchHistoryCard` (inline, visible always).
7. **Frontend - System stability**: Improve null-safety across all components that access `match.teams[index]` or `match.innings[index]`.
