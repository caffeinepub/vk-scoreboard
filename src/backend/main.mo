import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type MatchStatus = { #setup; #live; #completed };
  type InningsStatus = { #active; #closed };
  type ExtrasType = { #none; #wide; #noball; #bye; #legbye };
  type DismissalType = { #bowled; #caught; #runout; #stumping; #hitwicket };
  type Color = { #red; #blue; #green; #yellow; #black; #white };

  type Team = {
    id : Nat;
    name : Text;
    color : Color;
    players : [Player];
  };

  type Player = {
    id : Nat;
    name : Text;
    jerseyNumber : Nat;
    teamId : Nat;
    battingStats : BattingStats;
    bowlingStats : BowlingStats;
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

  module Ball {
    public func compare(ball1 : Ball, ball2 : Ball) : Order.Order {
      switch (Nat.compare(ball1.overNumber, ball2.overNumber)) {
        case (#equal) {
          Nat.compare(ball1.ballNumber, ball2.ballNumber);
        };
        case (order) { order };
      };
    };
  };

  type Over = [Ball];

  type FallOfWicket = {
    score : Nat;
    over : Nat;
    ball : Nat;
    batsmanId : Nat;
  };

  type Partnership = {
    runs : Nat;
    balls : Nat;
    strikerId : Nat;
    nonStrikerId : Nat;
    startOver : Nat;
    endOver : Nat;
  };

  type Innings = {
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

  module Team {
    public func compareByTeamId(team1 : Team, team2 : Team) : Order.Order {
      Nat.compare(team1.id, team2.id);
    };
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

  module Match {
    public func compare(match1 : Match, match2 : Match) : Order.Order {
      Nat.compare(match1.id, match2.id);
    };
  };

  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let matches = Map.empty<Nat, Match>();
  var nextMatchId = 1;
  var nextTeamId = 1;
  var nextPlayerId = 1;

  // Utils
  func getTeam(match : Match, teamId : Nat) : Team {
    switch (match.teams.find(func(team) { team.id == teamId })) {
      case (null) { Runtime.trap("Team not found") };
      case (?team) { team };
    };
  };

  func getPlayer(match : Match, playerId : Nat) : Player {
    for (team in match.teams.values()) {
      switch (team.players.find(func(p) { p.id == playerId })) {
        case (null) {};
        case (?player) { return player };
      };
    };
    Runtime.trap("Player not found");
  };

  // Match Management - Open to all callers (NO authorization checks)
  public shared ({ caller }) func createMatch(name : Text, date : Time.Time, maxOvers : ?Nat) : async Nat {
    let newMatch : Match = {
      id = nextMatchId;
      name;
      date;
      maxOvers;
      status = #setup;
      result = null;
      teams = [];
      innings = [];
    };

    matches.add(nextMatchId, newMatch);
    nextMatchId += 1;
    newMatch.id;
  };

  // Team Management - Open to all callers (NO authorization checks)
  public shared ({ caller }) func addTeam(matchId : Nat, teamName : Text, color : Color) : async Nat {
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        let newTeam : Team = {
          id = nextTeamId;
          name = teamName;
          color;
          players = [];
        };
        let updatedTeams = match.teams.concat([newTeam]);
        let updatedMatch = {
          match with
          teams = updatedTeams;
        };
        matches.add(matchId, updatedMatch);
        nextTeamId += 1;
        newTeam.id;
      };
    };
  };

  // Player Management - Open to all callers (NO authorization checks)
  public shared ({ caller }) func addPlayer(matchId : Nat, teamId : Nat, playerName : Text, jerseyNumber : Nat) : async Nat {
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        let team = getTeam(match, teamId);
        let newPlayer : Player = {
          id = nextPlayerId;
          name = playerName;
          jerseyNumber;
          teamId;
          battingStats = {
            runs = 0;
            ballsFaced = 0;
            fours = 0;
            sixes = 0;
            isOut = false;
          };
          bowlingStats = {
            overs = 0;
            maidens = 0;
            runs = 0;
            wickets = 0;
          };
        };

        let updatedPlayers = team.players.concat([newPlayer]);
        let updatedTeam = {
          team with
          players = updatedPlayers;
        };

        let updatedTeams = match.teams.map(
          func(t) {
            if (t.id == teamId) { updatedTeam } else { t };
          }
        );

        let updatedMatch = {
          match with
          teams = updatedTeams;
        };
        matches.add(matchId, updatedMatch);
        nextPlayerId += 1;
        newPlayer.id;
      };
    };
  };

  // Public Read APIs - No authorization required
  public query func getMatch(matchId : Nat) : async Match {
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) { match };
    };
  };

  public query func listMatches() : async [Match] {
    matches.values().toArray().sort();
  };
};
