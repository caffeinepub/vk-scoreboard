# VK Scoreboard

## Current State

VK Scoreboard is a full-stack cricket scoring app on ICP with:
- Username/password login (vagesh/vk888), no Internet Identity
- Match creation (name, date, optional over limit)
- Team & player setup (flexible player count)
- Ball-by-ball live scoring: runs 0–6, wide, no-ball, bye, leg-bye, wicket (all types), undo, end innings
- Scoring engine in `useCricketScoring.ts` with: striker/non-striker rotation, free hit, over completion, partnership tracker, fall of wickets, ball-by-ball history
- Auto-end conditions: target reached, all-out, overs complete
- Session persistence in localStorage + backend sync every 5s
- Public scoreboard at `/match/:id` (polls every 3s)
- Delete match (frontend + backend)
- Rematch (copy teams/players, reset scores)
- Admin dashboard at `/admin` (list matches, setup/score/view buttons)
- Dark neon theme with OKLCH colors (neon-green, electric-blue, cricket-gold, wicket-red)
- QR code component now added via caffeine

## Requested Changes (Diff)

### Add

1. **Match delete in Admin Dashboard** — add delete button with confirm dialog on admin dashboard match cards (already exists on public home page; needs to be added to AdminDashboardPage too)

2. **Player Profile System** — per-player cumulative stats page at `/admin/players`: total matches, runs, wickets, strike rate, best performance. Stats accumulate from localStorage match data after each completed match.

3. **Tournament Mode** — frontend-only tournaments stored in localStorage:
   - Create tournament (name)
   - Register teams
   - Generate fixtures (round-robin)
   - View tournament schedule
   - Page at `/admin/tournament` and `/admin/tournament/:id`

4. **Points Table** — auto-computed from completed tournament matches: MP, W, L, Points (2 per win), NRR. Shown on tournament detail page.

5. **Toss System** — before innings setup screen (when innings not started), show a Toss screen:
   - Animated coin flip (heads/tails visual)
   - Toss winner picks bat or bowl
   - Sets batting order for innings 1

6. **Partnership Tracker** — already exists partially; enhance display to show partnership prominently with player names

7. **Over Summary** — after each over completes, show a toast/banner with that over's deliveries: "Over 3 → 1 4 0 W 2 6"

8. **Player of the Match** — on FinalResultScreen, auto-select and display PoTM based on: highest scorer if runs >= 20, else highest wicket-taker, else best combined score (runs + wickets*20). Show trophy card.

9. **Match Highlights Screen** — on FinalResultScreen (below PoTM), display: highest scorer, best bowler, total fours, total sixes, match result.

10. **QR Code for Live Score** — on live scoring page and public scoreboard, show a QR code button that opens a modal with QR code pointing to `/match/:id`. Use the qr-code Caffeine component.

11. **Commentary System** — after each ball in live scoring, show a themed commentary toast:
    - 6: "SIX! Massive hit, that's gone all the way!"
    - 4: "FOUR! Races away to the boundary!"
    - Wicket: "OUT! The stumps are shattered!" / "CAUGHT! Brilliant catch in the deep!"
    - 0: "Dot ball. Pressure builds."
    - Wide: "Wide! Extra run added."
    - No Ball: "No Ball! Free hit coming up!"

12. **Score Graph** — runs vs overs progression chart on the live scoring page and public scoreboard. Implemented using a lightweight SVG line chart (no external chart lib needed). Data from `inningsState.balls`.

13. **Match History** — the public home page already shows match history. Add a dedicated `/history` route with filtering (all/completed/live) and match result display.

14. **Export Scorecard (PDF)** — add "Export PDF" button on FinalResultScreen and public scoreboard (completed matches). Uses `window.print()` with a print-only CSS class that renders a clean black-on-white scorecard.

15. **Theme Toggle** — add a theme selector in the header or settings: Dark (current default), Neon (extra bright neons, higher contrast), Light (white background). Persist in localStorage. CSS variable swap approach.

16. **Admin Control Panel** — enhance existing BallCorrectionPage. Add sections: correct score (manual adjustment), change player name, adjust over count for a match.

### Modify

- **AdminDashboardPage.tsx** — add delete button (with confirm dialog) to each match card, matching the style on MatchListPage
- **LiveScoringPage.tsx** — add: toss screen before innings setup, over summary toast, commentary toast, score graph, QR code button, Player of the Match + highlights on final result
- **FinalResultScreen** — extend with PoTM card, highlights section, export PDF button
- **PublicScoreboardPage.tsx** — add score graph, QR code button, export PDF button
- **App.tsx** — add routes for `/history`, `/admin/tournament`, `/admin/tournament/:id`, `/admin/players`

### Remove

Nothing removed.

## Implementation Plan

1. Add delete functionality to AdminDashboardPage (reuse same pattern as MatchListPage)
2. Add toss screen component in LiveScoringPage (shown before innings setup when innings 1 not yet started)
3. Add over summary toast after over completion (detect in LiveScoringPage via useEffect on currentOver)
4. Add enhanced commentary toast system replacing basic toasts
5. Add Player of the Match logic + card in FinalResultScreen
6. Add Match Highlights section in FinalResultScreen
7. Add Score Graph SVG component, wire into LiveScoringPage and PublicScoreboardPage
8. Add QR code modal (use qr-code Caffeine component) in LiveScoringPage + PublicScoreboardPage
9. Add Export PDF button using window.print() with print styles
10. Add Theme Toggle (dark/neon/light) in AppHeader, persist to localStorage
11. Add Player Profiles page at `/admin/players` (frontend-only, localStorage aggregation)
12. Add Tournament Mode pages (frontend-only localStorage)
13. Add Match History page at `/history`
14. Add new routes in App.tsx
15. Enhance Admin Control Panel (BallCorrectionPage) with score correction and player name editing
