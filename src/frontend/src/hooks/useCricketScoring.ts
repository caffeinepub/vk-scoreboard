import { useCallback, useEffect, useReducer } from "react";
import { DismissalType, ExtrasType } from "../types/cricket";
export { DismissalType, ExtrasType } from "../types/cricket";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocalBall {
  overNumber: number;
  ballNumber: number; // legal ball count within over (1-6)
  totalBallIndex: number; // absolute index in balls array
  runs: number;
  extrasType: ExtrasType;
  isWicket: boolean;
  dismissalType?: DismissalType;
  fielderId?: number;
  strikerId: number;
  nonStrikerId: number;
  bowlerId: number;
  isFreeHit: boolean;
  isLegalDelivery: boolean; // false for wide/no-ball
}

export interface LocalBatsmanStats {
  playerId: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
}

export interface LocalBowlerStats {
  playerId: number;
  overs: number; // completed overs
  ballsThisOver: number;
  runs: number; // runs conceded
  wickets: number;
  maidens: number;
  noBalls: number;
  wides: number;
}

export interface LocalPartnership {
  bat1Id: number;
  bat2Id: number;
  runs: number;
  balls: number;
}

export interface FallOfWicketLocal {
  score: number;
  wickets: number;
  batsmanId: number;
  over: number;
  ball: number;
}

export type AutoCloseReason =
  | "target_reached"
  | "overs_complete"
  | "all_out"
  | "manual"
  | null;

export interface InningsState {
  totalRuns: number;
  wickets: number;
  legalBalls: number; // total legal deliveries
  totalBalls: number; // includes wides/no-balls
  currentOver: number; // 0-indexed
  currentOverLegalBalls: number; // legal balls in current over (0-5)
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  extras: number;
  strikerId: number | null;
  nonStrikerId: number | null;
  bowlerId: number | null;
  balls: LocalBall[];
  batsmanStats: Map<number, LocalBatsmanStats>;
  bowlerStats: Map<number, LocalBowlerStats>;
  partnerships: LocalPartnership[];
  currentPartnership: LocalPartnership | null;
  fallOfWickets: FallOfWicketLocal[];
  isFreeHitNext: boolean;
  status: "not-started" | "active" | "closed";
  pendingBowlerChange: boolean;
  pendingBatsmanChange: boolean;
  autoCloseReason: AutoCloseReason;
}

export type BallEvent =
  | { type: "RUNS"; runs: number }
  | { type: "WIDE"; extraRuns?: number }
  | { type: "NO_BALL"; runs?: number }
  | { type: "BYE"; runs: number }
  | { type: "LEG_BYE"; runs: number }
  | {
      type: "WICKET";
      dismissalType: DismissalType;
      fielderId?: number;
      runs?: number;
    }
  | { type: "UNDO" };

export type ScoringAction =
  | {
      type: "RECORD_BALL";
      event: BallEvent;
      target?: number;
      maxOvers?: number;
      totalPlayers?: number;
    }
  | { type: "SET_STRIKER"; playerId: number }
  | { type: "SET_NON_STRIKER"; playerId: number }
  | { type: "SET_BOWLER"; playerId: number }
  | { type: "SET_NEXT_BATSMAN"; playerId: number }
  | { type: "CONFIRM_BOWLER_CHANGE"; bowlerId: number }
  | {
      type: "START_INNINGS";
      strikerId: number;
      nonStrikerId: number;
      bowlerId: number;
    }
  | { type: "CLOSE_INNINGS"; reason?: AutoCloseReason }
  | { type: "RESET_INNINGS" }
  | { type: "EDIT_BALL"; index: number; ball: Partial<LocalBall> }
  | { type: "SWAP_BATSMEN" }
  | { type: "SWAP_BOWLER"; newBowlerId: number }
  | { type: "UNDO" };

// ─── Initial State ────────────────────────────────────────────────────────────

function createInitialState(): InningsState {
  return {
    totalRuns: 0,
    wickets: 0,
    legalBalls: 0,
    totalBalls: 0,
    currentOver: 0,
    currentOverLegalBalls: 0,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    extras: 0,
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null,
    balls: [],
    batsmanStats: new Map(),
    bowlerStats: new Map(),
    partnerships: [],
    currentPartnership: null,
    fallOfWickets: [],
    isFreeHitNext: false,
    status: "not-started",
    pendingBowlerChange: false,
    pendingBatsmanChange: false,
    autoCloseReason: null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateBatsman(
  stats: Map<number, LocalBatsmanStats>,
  id: number,
): LocalBatsmanStats {
  return (
    stats.get(id) ?? {
      playerId: id,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    }
  );
}

function getOrCreateBowler(
  stats: Map<number, LocalBowlerStats>,
  id: number,
): LocalBowlerStats {
  return (
    stats.get(id) ?? {
      playerId: id,
      overs: 0,
      ballsThisOver: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      noBalls: 0,
      wides: 0,
    }
  );
}

function cloneMap<K, V>(m: Map<K, V>): Map<K, V> {
  return new Map(m);
}

// ─── Serialization for localStorage ──────────────────────────────────────────

function serializeState(state: InningsState): object {
  return {
    ...state,
    batsmanStats: Array.from(state.batsmanStats.entries()),
    bowlerStats: Array.from(state.bowlerStats.entries()),
  };
}

function deserializeState(raw: Record<string, unknown>): InningsState {
  return {
    ...(raw as unknown as InningsState),
    batsmanStats: new Map(
      (raw.batsmanStats as [number, LocalBatsmanStats][]) ?? [],
    ),
    bowlerStats: new Map(
      (raw.bowlerStats as [number, LocalBowlerStats][]) ?? [],
    ),
  };
}

export interface PersistedSession {
  inningsNumber: 1 | 2;
  innings1Snapshot: InningsState | null;
  inningsState: InningsState;
  tossCompleted: boolean;
  tossBattingTeamIndex: 0 | 1;
}

export function saveSession(matchId: string, session: PersistedSession): void {
  try {
    const serialized = {
      inningsNumber: session.inningsNumber,
      innings1Snapshot: session.innings1Snapshot
        ? serializeState(session.innings1Snapshot)
        : null,
      inningsState: serializeState(session.inningsState),
      tossCompleted: session.tossCompleted,
      tossBattingTeamIndex: session.tossBattingTeamIndex,
    };
    localStorage.setItem(`vk_cricket_${matchId}`, JSON.stringify(serialized));
  } catch {
    // ignore storage errors
  }
}

export function loadSession(matchId: string): PersistedSession | null {
  try {
    const raw = localStorage.getItem(`vk_cricket_${matchId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      inningsNumber: 1 | 2;
      innings1Snapshot: Record<string, unknown> | null;
      inningsState: Record<string, unknown>;
      tossCompleted?: boolean;
      tossBattingTeamIndex?: 0 | 1;
    };
    return {
      inningsNumber: parsed.inningsNumber,
      innings1Snapshot: parsed.innings1Snapshot
        ? deserializeState(parsed.innings1Snapshot)
        : null,
      inningsState: deserializeState(parsed.inningsState),
      tossCompleted: parsed.tossCompleted ?? false,
      tossBattingTeamIndex: parsed.tossBattingTeamIndex ?? 0,
    };
  } catch {
    return null;
  }
}

export function clearSession(matchId: string): void {
  try {
    localStorage.removeItem(`vk_cricket_${matchId}`);
  } catch {
    // ignore
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function scoringReducer(
  state: InningsState,
  action: ScoringAction,
): InningsState {
  switch (action.type) {
    case "START_INNINGS": {
      const batsmanStats = new Map<number, LocalBatsmanStats>();
      batsmanStats.set(
        action.strikerId,
        getOrCreateBatsman(batsmanStats, action.strikerId),
      );
      batsmanStats.set(
        action.nonStrikerId,
        getOrCreateBatsman(batsmanStats, action.nonStrikerId),
      );

      const bowlerStats = new Map<number, LocalBowlerStats>();
      bowlerStats.set(
        action.bowlerId,
        getOrCreateBowler(bowlerStats, action.bowlerId),
      );

      const partnership: LocalPartnership = {
        bat1Id: action.strikerId,
        bat2Id: action.nonStrikerId,
        runs: 0,
        balls: 0,
      };

      return {
        ...state,
        status: "active",
        strikerId: action.strikerId,
        nonStrikerId: action.nonStrikerId,
        bowlerId: action.bowlerId,
        batsmanStats,
        bowlerStats,
        currentPartnership: partnership,
        autoCloseReason: null,
      };
    }

    case "SET_NEXT_BATSMAN": {
      if (state.strikerId === null) {
        // Striker just got out, new batsman comes in as striker
        const batsmanStats = cloneMap(state.batsmanStats);
        batsmanStats.set(
          action.playerId,
          getOrCreateBatsman(batsmanStats, action.playerId),
        );

        const partnership: LocalPartnership = {
          bat1Id: action.playerId,
          bat2Id: state.nonStrikerId ?? 0,
          runs: 0,
          balls: 0,
        };

        return {
          ...state,
          strikerId: action.playerId,
          batsmanStats,
          currentPartnership: partnership,
          pendingBatsmanChange: false,
        };
      }
      // Non-striker position needs filling
      const batsmanStats = cloneMap(state.batsmanStats);
      batsmanStats.set(
        action.playerId,
        getOrCreateBatsman(batsmanStats, action.playerId),
      );
      return {
        ...state,
        nonStrikerId: action.playerId,
        batsmanStats,
        pendingBatsmanChange: false,
      };
    }

    case "CONFIRM_BOWLER_CHANGE": {
      const bowlerStats = cloneMap(state.bowlerStats);
      if (!bowlerStats.has(action.bowlerId)) {
        bowlerStats.set(
          action.bowlerId,
          getOrCreateBowler(bowlerStats, action.bowlerId),
        );
      }
      return {
        ...state,
        bowlerId: action.bowlerId,
        bowlerStats,
        pendingBowlerChange: false,
      };
    }

    case "CLOSE_INNINGS": {
      return {
        ...state,
        status: "closed",
        autoCloseReason: action.reason ?? "manual",
      };
    }

    case "RESET_INNINGS": {
      return createInitialState();
    }

    case "RECORD_BALL": {
      if (state.status !== "active") return state;
      if (
        state.strikerId === null ||
        state.nonStrikerId === null ||
        state.bowlerId === null
      )
        return state;

      const newState = processBall(state, action.event);

      // Check auto-close conditions after ball
      const autoClose = checkAutoClose(
        newState,
        action.target,
        action.maxOvers,
        action.totalPlayers,
      );
      if (autoClose) {
        return { ...newState, status: "closed", autoCloseReason: autoClose };
      }

      return newState;
    }

    case "UNDO": {
      if (state.balls.length === 0) return state;
      return rebuildStateFromBalls(state.balls.slice(0, -1), state);
    }

    case "EDIT_BALL": {
      const newBalls = [...state.balls];
      newBalls[action.index] = { ...newBalls[action.index], ...action.ball };
      return rebuildStateFromBalls(newBalls, state);
    }

    case "SWAP_BATSMEN": {
      if (state.status !== "active") return state;
      if (state.strikerId === null || state.nonStrikerId === null) return state;
      return {
        ...state,
        strikerId: state.nonStrikerId,
        nonStrikerId: state.strikerId,
      };
    }

    case "SWAP_BOWLER": {
      if (state.status !== "active") return state;
      const newBowlerId = action.newBowlerId;
      const newBowlerStats = getOrCreateBowler(state.bowlerStats, newBowlerId);
      const updatedBowlerStats = cloneMap(state.bowlerStats);
      updatedBowlerStats.set(newBowlerId, newBowlerStats);
      return {
        ...state,
        bowlerId: newBowlerId,
        bowlerStats: updatedBowlerStats,
      };
    }

    default:
      return state;
  }
}

// ─── Auto-close check ─────────────────────────────────────────────────────────

function checkAutoClose(
  state: InningsState,
  target?: number,
  maxOvers?: number,
  totalPlayers?: number,
): AutoCloseReason {
  // 2nd innings: team reaches or passes target
  if (target !== undefined && target > 0 && state.totalRuns >= target) {
    return "target_reached";
  }

  // Overs limit reached
  if (maxOvers !== undefined && maxOvers > 0 && state.currentOver >= maxOvers) {
    return "overs_complete";
  }

  // All out: wickets = totalPlayers - 1 (last man stands alone)
  if (
    totalPlayers !== undefined &&
    totalPlayers > 1 &&
    state.wickets >= totalPlayers - 1
  ) {
    return "all_out";
  }

  return null;
}

function processBall(state: InningsState, event: BallEvent): InningsState {
  if (event.type === "UNDO") return state;

  const strikerId = state.strikerId!;
  const nonStrikerId = state.nonStrikerId!;
  const bowlerId = state.bowlerId!;
  const isFreeHit = state.isFreeHitNext;

  let runs = 0;
  let extrasType: ExtrasType = ExtrasType.none;
  let isWicket = false;
  let dismissalType: DismissalType | undefined;
  let fielderId: number | undefined;
  let isLegalDelivery = true;
  let isFreeHitNext = false;

  // Extra runs credited to team but not batsman
  let extraRuns = 0;

  switch (event.type) {
    case "RUNS":
      runs = event.runs;
      extrasType = ExtrasType.none;
      isLegalDelivery = true;
      break;
    case "WIDE":
      extraRuns = 1 + (event.extraRuns ?? 0);
      runs = 0;
      extrasType = ExtrasType.wide;
      isLegalDelivery = false;
      break;
    case "NO_BALL":
      extraRuns = 1;
      runs = event.runs ?? 0;
      extrasType = ExtrasType.noball;
      isLegalDelivery = false;
      isFreeHitNext = true;
      break;
    case "BYE":
      extraRuns = event.runs;
      runs = 0;
      extrasType = ExtrasType.bye;
      isLegalDelivery = true;
      break;
    case "LEG_BYE":
      extraRuns = event.runs;
      runs = 0;
      extrasType = ExtrasType.legbye;
      isLegalDelivery = true;
      break;
    case "WICKET":
      runs = event.runs ?? 0;
      extrasType = ExtrasType.none;
      isWicket = true;
      dismissalType = event.dismissalType;
      fielderId = event.fielderId;
      isLegalDelivery = true;
      // Run-out on a no-ball: if free hit, only run-out is valid
      if (isFreeHit && dismissalType !== DismissalType.runout) {
        isWicket = false; // free hit — no wicket (except run out)
      }
      break;
  }

  const totalRunsScored = runs + extraRuns;

  // Build ball record
  const ball: LocalBall = {
    overNumber: state.currentOver,
    ballNumber: state.currentOverLegalBalls + (isLegalDelivery ? 1 : 0),
    totalBallIndex: state.balls.length,
    runs,
    extrasType,
    isWicket,
    dismissalType,
    fielderId,
    strikerId,
    nonStrikerId,
    bowlerId,
    isFreeHit,
    isLegalDelivery,
  };

  // Update batting stats
  const batsmanStats = cloneMap(state.batsmanStats);
  const striker = { ...getOrCreateBatsman(batsmanStats, strikerId) };

  // Batsman stats only for legal runs (not wides/byes/legbyes)
  if (extrasType === ExtrasType.none || extrasType === ExtrasType.noball) {
    striker.runs += runs;
    if (runs === 4) striker.fours++;
    if (runs === 6) striker.sixes++;
  }
  if (isLegalDelivery && extrasType !== ExtrasType.wide) {
    striker.balls++;
  }
  if (isWicket) {
    striker.isOut = true;
    striker.dismissalType = dismissalType;
  }
  batsmanStats.set(strikerId, striker);

  // Update bowling stats
  const bowlerStats = cloneMap(state.bowlerStats);
  const bowler = { ...getOrCreateBowler(bowlerStats, bowlerId) };

  // Runs conceded by bowler (not byes/legbyes)
  if (extrasType !== ExtrasType.bye && extrasType !== ExtrasType.legbye) {
    bowler.runs += totalRunsScored;
  }
  if (isWicket && dismissalType !== DismissalType.runout) {
    bowler.wickets++;
  }
  if (extrasType === ExtrasType.wide) bowler.wides++;
  if (extrasType === ExtrasType.noball) bowler.noBalls++;

  if (isLegalDelivery) {
    bowler.ballsThisOver++;
  }

  // Update totals
  let newLegalBalls = state.legalBalls;
  let newOverLegalBalls = state.currentOverLegalBalls;
  let newCurrentOver = state.currentOver;
  let pendingBowlerChange = false;

  if (isLegalDelivery) {
    newLegalBalls++;
    newOverLegalBalls++;
  }

  // Check over completion (6 legal balls)
  if (newOverLegalBalls >= 6) {
    // Check maiden over
    if (
      bowler.runs ===
      (bowlerStats.get(bowlerId)?.runs ?? 0) +
        (extrasType !== ExtrasType.bye && extrasType !== ExtrasType.legbye
          ? totalRunsScored
          : 0)
    ) {
      // Will calculate maiden after
    }
    bowler.overs++;
    bowler.ballsThisOver = 0;

    // Check if maiden (no runs this over — approximate based on this ball)
    // Maiden: bowler conceded 0 runs in the over. We'll handle this in full rebuild.
    newCurrentOver++;
    newOverLegalBalls = 0;
    pendingBowlerChange = true;
  }

  bowlerStats.set(bowlerId, bowler);

  // Update partnership
  const currentPartnership = state.currentPartnership
    ? {
        ...state.currentPartnership,
        runs: state.currentPartnership.runs + totalRunsScored,
        balls: state.currentPartnership.balls + (isLegalDelivery ? 1 : 0),
      }
    : null;

  // Strike rotation
  let newStrikerId: number | null = strikerId;
  let newNonStrikerId: number | null = nonStrikerId;

  if (isWicket) {
    newStrikerId = null; // needs replacement
  } else {
    // Determine runs that actually cause batsmen to physically change ends.
    // Penalty extras (wide +1, no-ball +1) do NOT count for rotation.
    let runsForRotation = 0;
    if (extrasType === ExtrasType.none) {
      // Normal delivery — batsman runs
      runsForRotation = runs;
    } else if (
      extrasType === ExtrasType.bye ||
      extrasType === ExtrasType.legbye
    ) {
      // Bye / leg-bye — batsmen ran, use extraRuns (the physical runs completed)
      runsForRotation = extraRuns;
    } else if (extrasType === ExtrasType.wide) {
      // Wide — no physical run by batsmen (penalty only); no rotation
      runsForRotation = 0;
    } else if (extrasType === ExtrasType.noball) {
      // No-ball — rotate only on batsman's actual runs, not the penalty +1
      runsForRotation = runs;
    }
    if (runsForRotation % 2 !== 0) {
      newStrikerId = nonStrikerId;
      newNonStrikerId = strikerId;
    }
  }

  // End of over: rotate batsmen
  if (newOverLegalBalls === 0 && isLegalDelivery && !isWicket) {
    // Swap at end of over (non-striker becomes striker)
    const tmp = newStrikerId;
    newStrikerId = newNonStrikerId;
    newNonStrikerId = tmp;
  }

  // Fall of wicket
  const newFallOfWickets = [...state.fallOfWickets];
  if (isWicket) {
    newFallOfWickets.push({
      score: state.totalRuns + totalRunsScored,
      wickets: state.wickets + 1,
      batsmanId: strikerId,
      over: state.currentOver,
      ball: state.currentOverLegalBalls + 1,
    });
  }

  // Partnerships
  const newPartnerships = [...state.partnerships];
  if (isWicket && state.currentPartnership) {
    newPartnerships.push({
      ...state.currentPartnership,
      runs: state.currentPartnership.runs + totalRunsScored,
      balls: state.currentPartnership.balls + (isLegalDelivery ? 1 : 0),
    });
  }

  // Extras tally
  const newWides =
    state.wides + (extrasType === ExtrasType.wide ? extraRuns : 0);
  const newNoBalls = state.noBalls + (extrasType === ExtrasType.noball ? 1 : 0);
  const newByes = state.byes + (extrasType === ExtrasType.bye ? extraRuns : 0);
  const newLegByes =
    state.legByes + (extrasType === ExtrasType.legbye ? extraRuns : 0);
  const newExtras = state.extras + extraRuns;

  return {
    ...state,
    totalRuns: state.totalRuns + totalRunsScored,
    wickets: state.wickets + (isWicket ? 1 : 0),
    legalBalls: newLegalBalls,
    totalBalls: state.totalBalls + 1,
    currentOver: newCurrentOver,
    currentOverLegalBalls: newOverLegalBalls,
    wides: newWides,
    noBalls: newNoBalls,
    byes: newByes,
    legByes: newLegByes,
    extras: newExtras,
    strikerId: newStrikerId,
    nonStrikerId: newNonStrikerId,
    balls: [...state.balls, ball],
    batsmanStats,
    bowlerStats,
    partnerships: isWicket ? newPartnerships : state.partnerships,
    currentPartnership: isWicket
      ? {
          bat1Id: newStrikerId ?? 0,
          bat2Id: newNonStrikerId ?? 0,
          runs: 0,
          balls: 0,
        }
      : currentPartnership,
    fallOfWickets: newFallOfWickets,
    isFreeHitNext,
    pendingBowlerChange,
    pendingBatsmanChange: isWicket,
  };
}

/**
 * Full rebuild for undo / edit operations.
 * Re-plays all balls from scratch to recompute correct state.
 */
function rebuildStateFromBalls(
  balls: LocalBall[],
  originalState: InningsState,
): InningsState {
  // We need to replay with original players
  // Start from a clean slate preserving player rosters
  let state: InningsState = {
    ...createInitialState(),
    status: "active",
    batsmanStats: new Map(originalState.batsmanStats),
    bowlerStats: new Map(),
  };

  // Reset batsman stats
  const freshBatsmanStats = new Map<number, LocalBatsmanStats>();
  originalState.batsmanStats.forEach((_, id) => {
    freshBatsmanStats.set(id, {
      playerId: id,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    });
  });
  state.batsmanStats = freshBatsmanStats;

  // Replay
  if (balls.length === 0) {
    // Reset to before first ball
    const firstBall = originalState.balls[0];
    if (firstBall) {
      state.strikerId = firstBall.strikerId;
      state.nonStrikerId = firstBall.nonStrikerId;
      state.bowlerId = firstBall.bowlerId;
    }
    return state;
  }

  // Use first ball to set initial players
  const firstBall = balls[0];
  state.strikerId = firstBall.strikerId;
  state.nonStrikerId = firstBall.nonStrikerId;
  state.bowlerId = firstBall.bowlerId;

  // Initialize batsman/bowler stats maps for players in play
  const ensureBatsman = (id: number) => {
    if (!state.batsmanStats.has(id)) {
      state.batsmanStats.set(id, {
        playerId: id,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
      });
    }
  };
  ensureBatsman(firstBall.strikerId);
  ensureBatsman(firstBall.nonStrikerId);

  for (const ball of balls) {
    let event: BallEvent;
    if (ball.isWicket) {
      event = {
        type: "WICKET",
        dismissalType: ball.dismissalType!,
        fielderId: ball.fielderId,
        runs: ball.runs,
      };
    } else if (ball.extrasType === ExtrasType.wide) {
      event = { type: "WIDE" };
    } else if (ball.extrasType === ExtrasType.noball) {
      event = { type: "NO_BALL", runs: ball.runs };
    } else if (ball.extrasType === ExtrasType.bye) {
      event = { type: "BYE", runs: ball.runs };
    } else if (ball.extrasType === ExtrasType.legbye) {
      event = { type: "LEG_BYE", runs: ball.runs };
    } else {
      event = { type: "RUNS", runs: ball.runs };
    }

    // Force the state's current striker/bowler to match the ball
    state = {
      ...state,
      strikerId: ball.strikerId,
      nonStrikerId: ball.nonStrikerId,
      bowlerId: ball.bowlerId,
    };

    state = processBall(state, event);
  }

  return { ...state, pendingBowlerChange: false, pendingBatsmanChange: false };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface CricketScoringOptions {
  matchId?: string;
  target?: number; // Set for 2nd innings
  maxOvers?: number; // Set when match has over limit
  totalPlayers?: number; // Batting team player count
}

export function useCricketScoring(options: CricketScoringOptions = {}) {
  const { target, maxOvers, totalPlayers } = options;

  const [inningsState, dispatch] = useReducer(
    scoringReducer,
    undefined,
    createInitialState,
  );

  const startInnings = useCallback(
    (strikerId: number, nonStrikerId: number, bowlerId: number) => {
      dispatch({ type: "START_INNINGS", strikerId, nonStrikerId, bowlerId });
    },
    [],
  );

  const recordBall = useCallback(
    (event: BallEvent) => {
      dispatch({ type: "RECORD_BALL", event, target, maxOvers, totalPlayers });
    },
    [target, maxOvers, totalPlayers],
  );

  const undoLastBall = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const confirmBowlerChange = useCallback((bowlerId: number) => {
    dispatch({ type: "CONFIRM_BOWLER_CHANGE", bowlerId });
  }, []);

  const setNextBatsman = useCallback((playerId: number) => {
    dispatch({ type: "SET_NEXT_BATSMAN", playerId });
  }, []);

  const closeInnings = useCallback((reason?: AutoCloseReason) => {
    dispatch({ type: "CLOSE_INNINGS", reason: reason ?? "manual" });
  }, []);

  const resetInnings = useCallback(() => {
    dispatch({ type: "RESET_INNINGS" });
  }, []);

  const editBall = useCallback((index: number, ball: Partial<LocalBall>) => {
    dispatch({ type: "EDIT_BALL", index, ball });
  }, []);

  const swapBatsmen = useCallback(() => {
    dispatch({ type: "SWAP_BATSMEN" });
  }, []);

  const swapBowler = useCallback((newBowlerId: number) => {
    dispatch({ type: "SWAP_BOWLER", newBowlerId });
  }, []);

  // ─── Computed helpers ──────────────────────────────────────────────────────

  const currentRunRate = (() => {
    if (inningsState.legalBalls === 0) return 0;
    const overs = inningsState.legalBalls / 6;
    return inningsState.totalRuns / overs;
  })();

  const oversString = (() => {
    return `${inningsState.currentOver}.${inningsState.currentOverLegalBalls}`;
  })();

  const currentOverBalls = inningsState.balls.filter(
    (b) => b.overNumber === inningsState.currentOver,
  );

  const requiredRuns =
    target !== undefined && target > 0
      ? Math.max(0, target - inningsState.totalRuns)
      : null;

  const requiredBalls =
    maxOvers !== undefined && maxOvers > 0
      ? Math.max(0, maxOvers * 6 - inningsState.legalBalls)
      : null;

  return {
    inningsState,
    startInnings,
    recordBall,
    undoLastBall,
    confirmBowlerChange,
    setNextBatsman,
    closeInnings,
    resetInnings,
    editBall,
    swapBatsmen,
    swapBowler,
    currentRunRate,
    oversString,
    currentOverBalls,
    requiredRuns,
    requiredBalls,
    dispatch,
  };
}
