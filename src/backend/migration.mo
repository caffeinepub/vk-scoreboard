import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";

module {
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
  type Partnership = {
    runs : Nat;
    balls : Nat;
    strikerId : Nat;
    nonStrikerId : Nat;
    startOver : Nat;
    endOver : Nat;
  };
  type FallOfWicket = {
    score : Nat;
    over : Nat;
    ball : Nat;
    batsmanId : Nat;
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
  type Over = [Ball];
  type DeprecatedInnings = {
    battingTeamId : Nat;
    bowlingTeamId : Nat;
    totalRuns : Nat;
    wickets : Nat;
    totalBalls : Nat;
    extras : Nat;
    wides : Nat;
    noBalls : Nat;
    byes : Nat;
    legByes : Nat;
    status : InningsStatus;
    isFirstInnings : Bool;
    overCount : Nat;
    strikerId : Nat;
    nonStrikerId : Nat;
    currentBowlerId : Nat;
    overs : [Over];
    balls : [Ball];
    wicketsFallen : [FallOfWicket];
    partnerships : [Partnership];
    currentPartnership : ?Partnership;
  };
  type Match = {
    id : Nat;
    name : Text;
    date : Int;
    maxOvers : ?Nat;
    status : MatchStatus;
    result : ?Text;
    teams : [Team];
    innings : [DeprecatedInnings];
  };
  type NewMatch = {
    id : Nat;
    name : Text;
    date : Int;
    maxOvers : ?Nat;
    status : MatchStatus;
    result : ?Text;
    teams : [Team];
    innings : [Innings];
  };
  type OldActor = {
    matches : Map.Map<Nat, Match>;
    nextMatchId : Nat;
    nextTeamId : Nat;
    nextPlayerId : Nat;
  };
  type NewActor = {
    matches : Map.Map<Nat, NewMatch>;
    nextMatchId : Nat;
    nextTeamId : Nat;
    nextPlayerId : Nat;
  };
  public func run(old : OldActor) : NewActor {
    let newMatches = old.matches.map<Nat, Match, NewMatch>(
      func(_id, oldMatch) {
        {
          oldMatch with
          innings = oldMatch.innings.map(
            func(deprecatedInnings) {
              {
                battingTeamId = deprecatedInnings.battingTeamId;
                bowlingTeamId = deprecatedInnings.bowlingTeamId;
                totalRuns = deprecatedInnings.totalRuns;
                wickets = deprecatedInnings.wickets;
                legalBalls = deprecatedInnings.totalBalls;
                wides = deprecatedInnings.wides;
                noBalls = deprecatedInnings.noBalls;
                byes = deprecatedInnings.byes;
                legByes = deprecatedInnings.legByes;
                result = null;
                isFirstInnings = deprecatedInnings.isFirstInnings;
              };
            }
          );
        };
      }
    );
    {
      matches = newMatches;
      nextMatchId = old.nextMatchId;
      nextTeamId = old.nextTeamId;
      nextPlayerId = old.nextPlayerId;
    };
  };
};
