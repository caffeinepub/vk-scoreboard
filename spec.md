# VK Scoreboard

## Current State

- Full-featured cricket scoring app with ball-by-ball live scoring, match history, toss, innings management.
- `useCricketScoring.ts` handles scoring reducer, plus `saveSession`/`loadSession` helpers persisting to localStorage keyed by match ID.
- Session is saved inside a `useEffect` in `LiveScoringPage.tsx` whenever `inningsState`, `inningsNumber`, `innings1Snapshot`, `tossCompleted`, or `tossBattingTeamIndex` change.
- The live-sync `useEffect` throttles backend pushes to max once per 5 seconds.
- Rematch creates a new match via `useRematch()` backend call, then navigates to the new match ID.
- `MatchHistoryPage.tsx` has a Rematch button that calls `useRematch()` — this can overwrite history of the previous match.
- `TeamSetupPage.tsx` has a manual form for entering team name + color + players one by one. No way to reuse previously entered teams.
- `BallPill.tsx` renders a dot ball (0 runs) as a circle with a `·` character — the dot is hard to distinguish visually in the ball-by-ball timeline.

## Requested Changes (Diff)

### Add

1. **Auto-save on every ball** — After every ball is recorded (`RECORD_BALL` action dispatch), immediately call `saveSession()` in addition to the existing debounced `useEffect`. The session save should happen synchronously after `dispatch` settles (via a dedicated `useEffect` on `inningsState.balls.length`). This ensures if the user leaves between balls, the session is always at the latest ball.

2. **Rematch safety guard** — When Rematch is triggered from `MatchHistoryPage.tsx` (not from the final result screen), the previous match data must NOT be altered. Currently `useRematch()` on the backend creates a new match copying teams/players — that is correct. The frontend fix: confirm the rematch should clear only the NEW match's session, never the old one. Add a confirmation dialog in `MatchHistoryPage.tsx` before triggering rematch, explaining "This will start a fresh match with the same teams. The previous match result will be kept." to prevent accidental triggers. The old match's backend data stays untouched; only the new match gets a session.

3. **"Use This Team" on TeamSetupPage** — In `TeamSetupPage.tsx`, above the Team Name input (when a team hasn't been added yet), show a collapsible section "Use a saved team" that lists team names from all previous matches (extracted from `useListMatches()` data). Each saved team shows a "Use This Team" button. When clicked, it pre-fills the team name field and automatically queues all that team's player names + jersey numbers for bulk-add, then shows a preview list with a single "Add Team + Players" action.

4. **Green dot indicator on dot-ball pills** — In `BallPill.tsx`, for the `ball.runs === 0` case (dot ball), add a small green filled circle (`w-2 h-2 rounded-full bg-neon-green`) positioned inside the circle (centered), replacing or accompanying the `·` character, so dot balls are clearly distinguishable at a glance.

### Modify

- `LiveScoringPage.tsx` — Add a focused `useEffect` on `inningsState.balls.length` that calls `saveSession` immediately (not debounced) whenever a new ball is added. The existing broader save effect is kept for toss/innings changes.
- `BallPill.tsx` — Update the 0-runs case to render a green dot inside the circle.
- `TeamSetupPage.tsx` — Add the "Use a saved team" section with saved team picker.
- `MatchHistoryPage.tsx` — Add a confirmation dialog before rematch is executed (the Rematch button itself needs to be added here as it currently doesn't exist — matches link to the public scoreboard, not to a rematch action).

### Remove

- Nothing to remove.

## Implementation Plan

1. **BallPill.tsx** — Replace the `·` text with a small green dot (`w-2 h-2 bg-neon-green rounded-full`) inside the dot-ball circle. Keep the circle's muted styling.

2. **LiveScoringPage.tsx (auto-save on every ball)** — Add a `useEffect` that depends on `[inningsState.balls.length]` and calls `saveSession(id, { inningsNumber, innings1Snapshot, inningsState, tossCompleted, tossBattingTeamIndex })` immediately whenever the balls array length changes. Guard it with `sessionLoaded && !isResettingRef.current` to avoid saves during reset.

3. **MatchHistoryPage.tsx (Rematch button + confirmation)** — Add a Rematch button to `MatchHistoryCard` for completed matches. Wire it to a confirmation `AlertDialog` ("Start a fresh rematch? The previous match result will remain saved."). On confirm, call `useRematch()` and navigate to the new match's scoring page. The old match's session in localStorage is NOT cleared.

4. **TeamSetupPage.tsx ("Use This Team")** — In `TeamSection`, import `useListMatches`. When no team has been added yet, show a "Use a saved team" accordion below the team name input. It lists unique team names from all matches that have at least 1 player. Clicking a team name pre-fills `teamName` and sets a `pendingPlayers` list. After the team is created, automatically fire `addPlayer` mutations for each pending player. Show a small player count badge next to each saved team name.
