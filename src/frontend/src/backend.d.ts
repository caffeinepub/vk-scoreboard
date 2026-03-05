import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Player {
    id: bigint;
    bowlingStats: BowlingStats;
    name: string;
    battingStats: BattingStats;
    jerseyNumber: bigint;
    teamId: bigint;
}
export type Time = bigint;
export interface FallOfWicket {
    ball: bigint;
    batsmanId: bigint;
    over: bigint;
    score: bigint;
}
export interface BowlingStats {
    maidens: bigint;
    overs: bigint;
    runs: bigint;
    wickets: bigint;
}
export interface BattingStats {
    fours: bigint;
    runs: bigint;
    sixes: bigint;
    ballsFaced: bigint;
    isOut: boolean;
}
export interface Match {
    id: bigint;
    status: MatchStatus;
    result?: string;
    teams: Array<Team>;
    date: Time;
    name: string;
    innings: Array<Innings>;
    maxOvers?: bigint;
}
export interface Ball {
    strikerId: bigint;
    ballNumber: bigint;
    dismissalType?: DismissalType;
    runs: bigint;
    extrasType: ExtrasType;
    nonStrikerId: bigint;
    overNumber: bigint;
    isFreeHit: boolean;
    isWicket: boolean;
    fielderId?: bigint;
    bowlerId: bigint;
}
export interface Innings {
    status: InningsStatus;
    strikerId: bigint;
    bowlingTeamId: bigint;
    overs: Array<Over>;
    byes: bigint;
    legByes: bigint;
    totalRuns: bigint;
    nonStrikerId: bigint;
    noBalls: bigint;
    wicketsFallen: Array<FallOfWicket>;
    wickets: bigint;
    balls: Array<Ball>;
    overCount: bigint;
    totalBalls: bigint;
    currentPartnership?: Partnership;
    isFirstInnings: boolean;
    extras: bigint;
    currentBowlerId: bigint;
    wides: bigint;
    partnerships: Array<Partnership>;
    battingTeamId: bigint;
}
export interface Partnership {
    startOver: bigint;
    strikerId: bigint;
    endOver: bigint;
    runs: bigint;
    nonStrikerId: bigint;
    balls: bigint;
}
export type Over = Array<Ball>;
export interface Team {
    id: bigint;
    name: string;
    color: Color;
    players: Array<Player>;
}
export enum Color {
    red = "red",
    blue = "blue",
    green = "green",
    black = "black",
    white = "white",
    yellow = "yellow"
}
export enum DismissalType {
    runout = "runout",
    hitwicket = "hitwicket",
    stumping = "stumping",
    bowled = "bowled",
    caught = "caught"
}
export enum ExtrasType {
    bye = "bye",
    noball = "noball",
    none = "none",
    wide = "wide",
    legbye = "legbye"
}
export enum InningsStatus {
    closed = "closed",
    active = "active"
}
export enum MatchStatus {
    live = "live",
    completed = "completed",
    setup = "setup"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPlayer(matchId: bigint, teamId: bigint, playerName: string, jerseyNumber: bigint): Promise<bigint>;
    addTeam(matchId: bigint, teamName: string, color: Color): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMatch(name: string, date: Time, maxOvers: bigint | null): Promise<bigint>;
    getCallerUserRole(): Promise<UserRole>;
    getMatch(matchId: bigint): Promise<Match>;
    isCallerAdmin(): Promise<boolean>;
    listMatches(): Promise<Array<Match>>;
}
