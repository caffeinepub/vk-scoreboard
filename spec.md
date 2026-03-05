# VK Scoreboard

## Current State

- Full innings scoring system exists (ball-by-ball via `useCricketScoring` hook, reducer-based local state)
- Match data is stored in backend (Motoko) but **live scoring state is ephemeral** — resets on page refresh
- Innings end only via manual "End Innings" button; no auto-end on overs/wickets/target
- No target calculation or display for 2nd innings
- No final result screen with winner, margin, or detailed summary
- Match history exists via `listMatches` backend query, but **result string is never saved** after match
- maxOvers field exists in Match model and CreateMatchPage, but is not enforced during scoring
- No LocalStorage persistence for live scoring state

## Requested Changes (Diff)

### Add

- **LocalStorage persistence**: save entire scoring session (both innings states, innings number, innings1Snapshot) to localStorage keyed by matchId; restore on page load
- **Target system**: after 1st innings ends, auto-calculate target = team1Runs + 1; display prominently in 2nd innings score banner and setup screen
- **Auto-end conditions for 2nd innings**:
  - Team 2 reaches or exceeds target → auto-close innings as win
  - All overs completed (based on match maxOvers) → auto-close innings
  - All wickets lost (wickets === total players - 1) → auto-close innings
- **Auto-end for 1st innings**: overs completed or all wickets lost → auto-close innings
- **Final result screen**: shown after 2nd innings closes; displays winning team name, both scores, overs played, wickets, result text (e.g. "Team B won by 3 wickets" or "Team A won by 10 runs"); saves result to match history via backend
- **Result save to backend**: call a new `completeMatch` endpoint (or update via `updateMatchResult`) to mark match as completed and persist result string + innings snapshots
- **Required runs/balls display**: in live 2nd innings banner show "Need X runs off Y balls"
- **maxOvers enforcement**: when match has maxOvers set, show over count vs limit; auto-end innings when overs reach maxOvers limit

### Modify

- `useCricketScoring` hook: add target param, auto-close trigger, persist/restore from localStorage
- `LiveScoringPage`: add target banner for 2nd innings setup screen, show target in score header, show "Need X runs" live, add final result screen component, wire auto-end effects, save result to backend
- Remove the "Scoring is local. Refresh will reset scores." warning banner (since data will now be persisted)
- `CreateMatchPage`: make maxOvers field with preset quick-pick buttons (5, 10, 20 overs)

### Remove

- The ephemeral-scoring warning banner in LiveScoringPage

## Implementation Plan

1. Add `useMatchStorage` hook (localStorage load/save for innings session state keyed by matchId)
2. Update `InningsState` and `useCricketScoring`:
   - Accept `target` and `maxOvers` and `totalPlayers` params
   - After each ball, check auto-close conditions and set `status: "closed"` automatically with a reason
   - Expose `autoCloseReason` for UI messaging
3. Update `LiveScoringPage`:
   - On mount, restore from localStorage; save on every state change
   - Pass target/maxOvers/totalPlayers to scoring hook
   - Show target banner in 2nd innings SetupScreen
   - Show "Need X runs off Y balls" in active score banner during 2nd innings
   - After 2nd innings closes, render `FinalResultScreen` component (winner, scores, overs, wickets, result string)
   - Save result to backend on match completion
4. Update `CreateMatchPage`: add quick-pick buttons for common over counts (5, 10, 20)
5. Remove ephemeral-scoring warning
