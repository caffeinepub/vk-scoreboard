import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Migration "migration";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Cricket Scoreboard Types
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
  module Match {
    public func compareById(a : Match, b : Match) : Order.Order {
      Nat.compare(b.id, a.id); // To sort descending by ID (newest first)
    };
  };

  // State
  let matches = Map.empty<Nat, Match>();
  var nextMatchId = 1;
  var nextTeamId = 1;
  var nextPlayerId = 1;

  // Helper functions
  func findTeam(teams : [Team], teamId : Nat) : ?Team {
    teams.find(func(team) { team.id == teamId });
  };

  // Match Management
  public shared ({ caller }) func createMatch(name : Text, date : Time.Time, maxOvers : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create matches");
    };
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

  // Team Management
  public shared ({ caller }) func addTeam(matchId : Nat, teamName : Text, color : Color) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add teams");
    };
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

  // Player Management
  public shared ({ caller }) func addPlayer(matchId : Nat, teamId : Nat, playerName : Text, jerseyNumber : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add players");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        let maybeTeam = findTeam(match.teams, teamId);
        switch (maybeTeam) {
          case (null) { Runtime.trap("Team not found") };
          case (?team) {
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
    };
  };

  // Delete Match - Admin only due to destructive nature
  public shared ({ caller }) func deleteMatch(matchId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete matches");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?_) {
        matches.remove(matchId);
      };
    };
  };

  // Rematch
  public shared ({ caller }) func rematch(matchId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rematches");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?originalMatch) {
        let newMatch : Match = {
          id = nextMatchId;
          name = originalMatch.name # " (Rematch)";
          date = Time.now();
          maxOvers = originalMatch.maxOvers;
          status = #setup;
          result = null;
          teams = originalMatch.teams.map(
            func(team) {
              let newTeamId = nextTeamId;
              nextTeamId += 1;
              {
                team with
                id = newTeamId;
                players = team.players.map(
                  func(player) {
                    let newPlayer = {
                      player with
                      id = nextPlayerId;
                      teamId = newTeamId;
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
                    nextPlayerId += 1;
                    newPlayer;
                  }
                );
              };
            }
          );
          innings = [];
        };
        matches.add(nextMatchId, newMatch);
        nextMatchId += 1;
        newMatch.id;
      };
    };
  };

  // Save Innings Result
  public shared ({ caller }) func saveInningsResult(
    matchId : Nat,
    isFirstInnings : Bool,
    battingTeamId : Nat,
    bowlingTeamId : Nat,
    totalRuns : Nat,
    wickets : Nat,
    legalBalls : Nat,
    wides : Nat,
    noBalls : Nat,
    byes : Nat,
    legByes : Nat,
    result : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save innings results");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        let newInnings = {
          battingTeamId;
          bowlingTeamId;
          totalRuns;
          wickets;
          legalBalls;
          wides;
          noBalls;
          byes;
          legByes;
          result;
          isFirstInnings;
        };
        let filteredInnings = match.innings.filter(
          func(innings) { innings.isFirstInnings != isFirstInnings }
        );
        let updatedInningsList = filteredInnings.concat([newInnings]);
        let updatedMatchResult = {
          match with
          innings = updatedInningsList;
          result;
          status = switch (result) {
            case (null) { match.status };
            case (_) { #completed };
          };
        };
        matches.add(matchId, updatedMatchResult);
      };
    };
  };

  // Public Read APIs - Open to all including guests
  public query ({ caller }) func getMatch(matchId : Nat) : async Match {
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) { match };
    };
  };

  public query ({ caller }) func listMatches() : async [Match] {
    matches.values().toArray().sort(Match.compareById);
  };
};

