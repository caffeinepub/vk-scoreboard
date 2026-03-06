# VK Scoreboard

## Current State
- Full-stack cricket scoreboard app with Motoko backend and React frontend
- Admin login via username/password (vagesh / vk888)
- Backend has authorization checks on createMatch, addTeam, addPlayer, rematch, deleteMatch, saveInningsResult — these are causing "Authorization Failed" errors when the session token is not recognized as a "user" role
- Match History page exists but has no bulk-delete functionality
- Final result screen exists (FinalResultScreen component in LiveScoringPage.tsx) but has basic layout — no cricket-broadcast-style result card showing both innings lines side by side
- Scoring buttons use `isPending` state from React Query mutations, causing loading delays
- All scoring (run buttons, extras, wicket) goes through async mutation calls that show spinners

## Requested Changes (Diff)

### Add
- Match History: checkbox on each match card for multi-select
- Match History: "Delete Selected" button (visible when at least one match is selected) that deletes all checked matches and clears selection
- Match History: "Select All" toggle for convenience
- Enhanced FinalResultScreen: cricket-broadcast-style result card showing:
  - Winning team name prominently at top
  - Both innings lines: `Team A – 85/6 (8 overs)` and `Team B – 78/8 (8 overs)`
  - Result line: `VK Warriors won by 7 runs`
  - Rematch button prominently placed

### Modify
- Backend: remove ALL auth checks from createMatch, addTeam, addPlayer, rematch, deleteMatch, saveInningsResult — these should work for any caller, no role required
- Scoring buttons: remove loading/pending states from run buttons (0–6), wide, no ball, bye, leg bye, wicket, and end innings — all should respond instantly with local state only; only save to backend async in background without blocking the UI
- CreateMatchPage: remove "Connecting to backend..." / "Preparing..." spinner on the submit button — button should be enabled as long as name is filled in; backend call happens on submit without blocking label changes
- Rematch: fix null-safety so it never crashes with "Cannot read properties of undefined (reading 'team')"
- FinalResultScreen: replace current layout with cleaner broadcast-style result card at top, followed by a compact scorecard table showing both innings, then action buttons (Rematch + Back to Matches)

### Remove
- Loading spinners on individual ball scoring buttons
- "Connecting to backend..." / "Preparing..." states on Create Match submit button
- Auth guards in backend for match mutation functions

## Implementation Plan
1. **Backend fix**: Remove `AccessControl.hasPermission` checks from `createMatch`, `addTeam`, `addPlayer`, `rematch`, `deleteMatch`, `saveInningsResult` in `main.mo`
2. **CreateMatchPage**: simplify `isButtonDisabled` to only check `!name.trim()`; remove `isPreparing` state and `showBackendBanner` logic; keep retry on error
3. **LiveScoringPage / ScoringButtons**: make all run/extra/wicket button actions fire immediately against local state (they already do via `useCricketScoring` hook); remove any `disabled={disabled}` that ties to mutation pending state — only disable during wicket dialog open
4. **FinalResultScreen**: redesign top card to show broadcast-style layout with both innings score lines + result text; keep Rematch button and POTM/Highlights below
5. **MatchHistoryPage**: add `selectedIds` state (Set<string>); render checkbox on each card; show "Delete Selected (N)" action button; wire to `useDeleteMatch` mutation in a loop; add "Select All" toggle
