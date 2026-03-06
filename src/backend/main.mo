import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";


import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Specify the data migration through the with clause

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
  type PlayerAggregateStats = {
    totalMatches : Nat;
    totalRuns : Nat;
    totalBalls : Nat;
    totalFours : Nat;
    totalSixes : Nat;
    totalWickets : Nat;
    totalOversBowled : Nat;
    totalRunsConceded : Nat;
  };
  type TeamAggregateStats = {
    totalMatches : Nat;
    wins : Nat;
    losses : Nat;
    totalRunsScored : Nat;
    totalWicketsTaken : Nat;
  };

  // State
  let matches = Map.empty<Nat, Match>();
  var nextMatchId = 1;
  var nextTeamId = 1;
  var nextPlayerId = 1;
  let playerStatsStore = Map.empty<Nat, PlayerAggregateStats>();
  let teamStatsStore = Map.empty<Text, TeamAggregateStats>();

  // Helper functions
  func findTeam(teams : [Team], teamId : Nat) : ?Team {
    teams.find(func(team) { team.id == teamId });
  };

  func mergePlayerStats(existing : PlayerAggregateStats, newStats : PlayerAggregateStats) : PlayerAggregateStats {
    {
      totalMatches = existing.totalMatches + newStats.totalMatches;
      totalRuns = existing.totalRuns + newStats.totalRuns;
      totalBalls = existing.totalBalls + newStats.totalBalls;
      totalFours = existing.totalFours + newStats.totalFours;
      totalSixes = existing.totalSixes + newStats.totalSixes;
      totalWickets = existing.totalWickets + newStats.totalWickets;
      totalOversBowled = existing.totalOversBowled + newStats.totalOversBowled;
      totalRunsConceded = existing.totalRunsConceded + newStats.totalRunsConceded;
    };
  };

  func mergeTeamStats(existing : TeamAggregateStats, stats : TeamAggregateStats) : TeamAggregateStats {
    {
      totalMatches = existing.totalMatches + stats.totalMatches;
      wins = existing.wins + stats.wins;
      losses = existing.losses + stats.losses;
      totalRunsScored = existing.totalRunsScored + stats.totalRunsScored;
      totalWicketsTaken = existing.totalWicketsTaken + stats.totalWicketsTaken;
    };
  };

  // Match Management
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

  // Team Management
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

  // Player Management
  public shared ({ caller }) func addPlayer(matchId : Nat, teamId : Nat, playerName : Text, jerseyNumber : Nat) : async Nat {
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

  // Delete Match
  public shared ({ caller }) func deleteMatch(matchId : Nat) : async () {
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?_) {
        matches.remove(matchId);
      };
    };
  };

  // Rematch
  public shared ({ caller }) func rematch(matchId : Nat) : async Nat {
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

  // NEW AGGREGATE STATS APIs
  public shared ({ caller }) func savePlayerStats(playerId : Nat, matchId : Nat, runs : Nat, balls : Nat, fours : Nat, sixes : Nat, wickets : Nat, oversBowled : Nat, runsConceded : Nat) : async () {
    let newStats : PlayerAggregateStats = {
      totalMatches = 1;
      totalRuns = runs;
      totalBalls = balls;
      totalFours = fours;
      totalSixes = sixes;
      totalWickets = wickets;
      totalOversBowled = oversBowled;
      totalRunsConceded = runsConceded;
    };

    switch (playerStatsStore.get(playerId)) {
      case (null) {
        playerStatsStore.add(playerId, newStats);
      };
      case (?existingStats) {
        playerStatsStore.add(playerId, mergePlayerStats(existingStats, newStats));
      };
    };
  };

  public shared ({ caller }) func saveTeamStats(teamName : Text, isWin : Bool, runsScored : Nat, wicketsTaken : Nat) : async () {
    let newStats : TeamAggregateStats = {
      totalMatches = 1;
      wins = if isWin { 1 } else { 0 };
      losses = if isWin { 0 } else { 1 };
      totalRunsScored = runsScored;
      totalWicketsTaken = wicketsTaken;
    };
    switch (teamStatsStore.get(teamName)) {
      case (null) {
        teamStatsStore.add(teamName, newStats);
      };
      case (?existingStats) {
        teamStatsStore.add(teamName, mergeTeamStats(existingStats, newStats));
      };
    };
  };

  public query ({ caller }) func getPlayerAggregateStats(playerId : Nat) : async ?PlayerAggregateStats {
    playerStatsStore.get(playerId);
  };

  public query ({ caller }) func getAllTeamStats() : async [(Text, TeamAggregateStats)] {
    teamStatsStore.toArray();
  };
};
