# VK Scoreboard

## Current State

- Full-stack cricket scoreboard app with Motoko backend and React frontend
- Admin login (username: vagesh / password: vk888) to create and score matches
- Backend stores matches, teams, players via `createMatch`, `addTeam`, `addPlayer`, `getMatch`, `listMatches`
- Frontend uses LocalStorage for scoring session persistence (ball-by-ball)
- Live scoring page (LiveScoringPage) uses `useCricketScoring` reducer hook
- End Innings button exists with confirmation dialog
- 1st innings summary shows target; 2nd innings has live "Need X runs" counter
- Auto-close triggers exist for target_reached, overs_complete, all_out
- PublicScoreboardPage polls backend for live view
- No delete match functionality
- No rematch functionality
- Live share works only via direct URL; no explicit "Share" button
- Score data stored in LocalStorage only (lost on different device/browser)
- Overs limit enforced in frontend but not always stopping innings cleanly

## Requested Changes (Diff)

### Add
- `deleteMatch(matchId)` backend function — removes a match from the map
- `rematch(matchId)` backend function — creates a new match copying team/player names, returns new matchId
- `saveInningsResult(matchId, inningsIndex, totalRuns, wickets, totalBalls, result)` — persist innings data to backend so public viewers see accurate data
- Delete button on each match card on the home page (MatchListPage) with confirmation dialog
- Rematch button on the final result screen — keeps same teams/players, resets score, navigates to new match
- Share Match Link button during scoring and on public scoreboard — copies URL to clipboard and shows toast
- "Need X runs from Y balls" banner displayed prominently during 2nd innings chase, calculated in real time
- Target banner displayed at the top of the 2nd innings scoreboard (both admin and public views)
- Balls remaining calculated from maxOvers * 6 - legalBalls (when maxOvers set); otherwise from total balls for unlimited overs it just shows balls faced

### Modify
- Target calculation: already `innings1.totalRuns + 1` — verify it is consistently used everywhere and fix any off-by-one
- Auto-end on target reached: already implemented in `checkAutoClose` — verify it fires and shows result correctly
- Result string: already uses `buildResultText` — add "with X balls remaining" for target_reached case when maxOvers is set
- Final result screen: add Rematch button alongside "Back to Matches"
- Overs limit: already in `checkAutoClose` — add a visual over limit progress bar / warning when last over approaching
- PublicScoreboardPage: poll every 3s when live (was 5s); add share button; show target banner more prominently
- MatchListPage: add Delete button to each match card (only shown when logged in as admin)
- Match cards: show over limit label if set

### Remove
- Nothing removed

## Implementation Plan

1. **Backend**: Add `deleteMatch`, `rematch`, and `saveInningsResult` functions to main.mo. `rematch` copies team+player names into a new match and returns its ID. `saveInningsResult` updates a match's innings array with final data and sets result text.

2. **useQueries.ts**: Add `useDeleteMatch`, `useRematch`, `useSaveInningsResult` mutation hooks.

3. **MatchListPage.tsx**: Add Delete button (trash icon) to each match card. Show only when `isLoggedIn`. Confirmation alert dialog before delete. On confirm call `deleteMatch` mutation and invalidate queries.

4. **LiveScoringPage.tsx**:
   - After 2nd innings auto-closes with `target_reached`, calculate balls remaining = maxOvers*6 - legalBalls (if maxOvers) or just show wickets margin
   - Add Share button (copy URL to clipboard) in the scoring header
   - Add Rematch button on FinalResultScreen — calls `rematch(matchId)`, then navigates to new match setup
   - Fix result string to include "with X balls remaining" when target reached with overs set
   - Call `useSaveInningsResult` when innings closes to persist to backend

5. **PublicScoreboardPage.tsx**:
   - Poll every 3s when match is live
   - Add Share button (navigator.clipboard copy)
   - Show target and "Need X runs from Y balls" banner prominently when 2nd innings is active
   - Pull target from innings1.totalRuns + 1

6. **useCricketScoring.ts**: Ensure `requiredBalls` is also computed when no maxOvers by just showing balls bowled vs target (unlimited chase shows runs needed but not balls remaining). Keep existing logic.
