# VK Scoreboard

## Current State
- LiveScoringPage.tsx handles ball-by-ball scoring with a ScoringButtons component
- useCricketScoring hook manages innings state with status: "not-started" | "active" | "closed"
- A `closeInnings()` function already exists in the hook (dispatches CLOSE_INNINGS action)
- When status is "closed", scoring is already blocked (status !== "active" guard in reducer)
- After innings 1, there is no UI flow to switch to innings 2 — the inningsNumber state is hardcoded to 1
- There is no "End Innings" button or confirmation dialog
- No innings summary screen between innings 1 and innings 2

## Requested Changes (Diff)

### Add
- "End Innings" button below the scoring buttons (visible only when innings is active)
- Confirmation AlertDialog before ending innings (to prevent accidental taps)
  - Show current score summary in the dialog (runs/wickets/overs)
  - Two buttons: "Cancel" and "End Innings" (confirm)
- After confirmation: call `scoring.closeInnings()` which sets status to "closed"
- Innings Summary screen that appears immediately after innings 1 ends
  - Shows first innings scorecard: total runs, wickets, overs, batsman stats, bowler stats
  - "Start 2nd Innings" button that resets scoring state and loads innings 2 setup
  - If innings 2 ends, show a Match Summary screen instead
- State variable to track which innings number is active (1 or 2), replacing the hardcoded `useState<1 | 2>(1)`
- State to store the completed first innings snapshot (totalRuns, wickets, oversString, batsmanStats, bowlerStats) so it can be shown during second innings as a target

### Modify
- ScoringButtons component: add `onEndInnings` prop and render the "End Innings" button below Undo
- LiveScoringPage: replace hardcoded `inningsNumber = 1` with managed state
- When innings status is "closed" AND inningsNumber is 1: show InningsSummary component with "Start 2nd Innings" CTA
- When innings status is "closed" AND inningsNumber is 2: show MatchSummary component
- Scoring buttons `disabled` prop: also disable when `inningsState.status === "closed"`
- Second innings setup: swap batting/bowling teams (team index 1 bats, team index 0 bowls)
- Starting 2nd innings: reset the scoring hook state by calling a new `resetInnings()` action, then call `startInnings()` after setup

### Remove
- Nothing removed

## Implementation Plan
1. Add "End Innings" button in ScoringButtons, wired to new `onEndInnings` prop
2. Add EndInningsConfirmDialog (AlertDialog) in LiveScoringPage with current score summary
3. On confirmation, call `scoring.closeInnings()`
4. Add `inningsNumber` state (1 | 2) and `innings1Snapshot` state to LiveScoringPage
5. Add a RESET_INNINGS action to useCricketScoring reducer that returns a fresh `not-started` state while preserving team/player context for replays
6. After innings 1 closes: render InningsSummaryScreen with all batsman/bowler stats and a "Start 2nd Innings" button
7. "Start 2nd Innings" button: set inningsNumber=2, call scoring dispatch RESET_INNINGS, show SetupScreen for 2nd innings
8. After innings 2 closes: render MatchSummaryScreen showing both innings results
9. Apply data-ocid markers to all new interactive surfaces
