import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  // Types for migration
  type DismissalType = { #bowled; #caught; #runout; #stumping; #hitwicket };
  type Color = { #red; #blue; #green; #yellow; #black; #white };
  type MatchStatus = { #setup; #live; #completed };
  type InningsStatus = { #active; #closed };
  type ExtrasType = { #none; #wide; #noball; #bye; #legbye };
  type Ball = {
    overNumber : Nat;
    ballNumber : Nat;
    runs : Nat;
    extrasType : ExtrasType;
    isWicket : Bool;
    dismissalType : ?DismissalType;
    fielderId : ?Nat;
    isFreeHit : Bool;
    strikerId : Nat;
    nonStrikerId : Nat;
    bowlerId : Nat;
  };
  type BattingStats = {
    runs : Nat;
    ballsFaced : Nat;
    fours : Nat;
    sixes : Nat;
    isOut : Bool;
  };
  type BowlingStats = {
    overs : Nat;
    maidens : Nat;
    runs : Nat;
    wickets : Nat;
  };
  type Innings = {
    battingTeamId : Nat;
    bowlingTeamId : Nat;
    totalRuns : Nat;
    wickets : Nat;
    legalBalls : Nat;
    wides : Nat;
    noBalls : Nat;
    byes : Nat;
    legByes : Nat;
    result : ?Text;
    isFirstInnings : Bool;
  };
  type Player = {
    id : Nat;
    name : Text;
    jerseyNumber : Nat;
    teamId : Nat;
    battingStats : BattingStats;
    bowlingStats : BowlingStats;
  };
  type Team = {
    id : Nat;
    name : Text;
    color : Color;
    players : [Player];
  };
  type Match = {
    id : Nat;
    name : Text;
    date : Time.Time;
    maxOvers : ?Nat;
    status : MatchStatus;
    result : ?Text;
    teams : [Team];
    innings : [Innings];
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    matches : Map.Map<Nat, Match>;
    nextMatchId : Nat;
    nextTeamId : Nat;
    nextPlayerId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  // migration function must return new state
  public func run(old : OldActor) : OldActor {
    old;
  };
};
