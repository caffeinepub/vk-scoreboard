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
export interface Innings {
    result?: string;
    bowlingTeamId: bigint;
    byes: bigint;
    legByes: bigint;
    totalRuns: bigint;
    noBalls: bigint;
    legalBalls: bigint;
    wickets: bigint;
    isFirstInnings: boolean;
    wides: bigint;
    battingTeamId: bigint;
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
export interface UserProfile {
    name: string;
}
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
    deleteMatch(matchId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMatch(matchId: bigint): Promise<Match>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listMatches(): Promise<Array<Match>>;
    rematch(matchId: bigint): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveInningsResult(matchId: bigint, isFirstInnings: boolean, battingTeamId: bigint, bowlingTeamId: bigint, totalRuns: bigint, wickets: bigint, legalBalls: bigint, wides: bigint, noBalls: bigint, byes: bigint, legByes: bigint, result: string | null): Promise<void>;
}
