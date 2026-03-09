import { useCallback, useState } from "react";

export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchId?: string;
  result?: string; // "HomeTeam won" etc
  homeScore?: string; // "120/4"
  awayScore?: string;
  overs?: number;
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: number;
  teams: string[];
  fixtures: Fixture[];
}

const TOURNAMENTS_KEY = "vk_tournaments";

function loadTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(TOURNAMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Tournament[];
  } catch {
    return [];
  }
}

function saveTournaments(tournaments: Tournament[]): void {
  try {
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
  } catch {
    // ignore
  }
}

function generateFixtures(teams: string[]): Fixture[] {
  const fixtures: Fixture[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        id: `${Date.now()}-${i}-${j}`,
        homeTeam: teams[i]!,
        awayTeam: teams[j]!,
      });
    }
  }
  return fixtures;
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>(loadTournaments);

  const createTournament = useCallback(
    (name: string, teams: string[]): Tournament => {
      const tournament: Tournament = {
        id: Date.now().toString(),
        name,
        createdAt: Date.now(),
        teams,
        fixtures: generateFixtures(teams),
      };
      const updated = [...tournaments, tournament];
      saveTournaments(updated);
      setTournaments(updated);
      return tournament;
    },
    [tournaments],
  );

  const updateFixture = useCallback(
    (tournamentId: string, fixture: Fixture) => {
      const updated = tournaments.map((t) => {
        if (t.id !== tournamentId) return t;
        return {
          ...t,
          fixtures: t.fixtures.map((f) => (f.id === fixture.id ? fixture : f)),
        };
      });
      saveTournaments(updated);
      setTournaments(updated);
    },
    [tournaments],
  );

  const addFixture = useCallback(
    (tournamentId: string, fixture: Fixture) => {
      const updated = tournaments.map((t) => {
        if (t.id !== tournamentId) return t;
        return {
          ...t,
          fixtures: [...t.fixtures, fixture],
        };
      });
      saveTournaments(updated);
      setTournaments(updated);
    },
    [tournaments],
  );

  const updateFixtureMatchId = useCallback(
    (tournamentId: string, fixtureId: string, matchId: string) => {
      const updated = tournaments.map((t) => {
        if (t.id !== tournamentId) return t;
        return {
          ...t,
          fixtures: t.fixtures.map((f) =>
            f.id === fixtureId ? { ...f, matchId } : f,
          ),
        };
      });
      saveTournaments(updated);
      setTournaments(updated);
    },
    [tournaments],
  );

  const deleteTournament = useCallback(
    (tournamentId: string) => {
      const updated = tournaments.filter((t) => t.id !== tournamentId);
      saveTournaments(updated);
      setTournaments(updated);
    },
    [tournaments],
  );

  const getTournament = useCallback(
    (id: string): Tournament | undefined => {
      return tournaments.find((t) => t.id === id);
    },
    [tournaments],
  );

  return {
    tournaments,
    createTournament,
    updateFixture,
    addFixture,
    updateFixtureMatchId,
    deleteTournament,
    getTournament,
  };
}

export interface TeamStanding {
  team: string;
  mp: number;
  wins: number;
  losses: number;
  pts: number;
}

export function computePointsTable(fixtures: Fixture[]): TeamStanding[] {
  const standings = new Map<string, TeamStanding>();

  const ensureTeam = (team: string) => {
    if (!standings.has(team)) {
      standings.set(team, { team, mp: 0, wins: 0, losses: 0, pts: 0 });
    }
  };

  for (const fixture of fixtures) {
    ensureTeam(fixture.homeTeam);
    ensureTeam(fixture.awayTeam);

    if (fixture.result) {
      const home = standings.get(fixture.homeTeam)!;
      const away = standings.get(fixture.awayTeam)!;
      home.mp++;
      away.mp++;

      if (fixture.result.includes(fixture.homeTeam)) {
        home.wins++;
        home.pts += 2;
        away.losses++;
      } else if (fixture.result.includes(fixture.awayTeam)) {
        away.wins++;
        away.pts += 2;
        home.losses++;
      }
      standings.set(fixture.homeTeam, home);
      standings.set(fixture.awayTeam, away);
    }
  }

  return Array.from(standings.values()).sort(
    (a, b) => b.pts - a.pts || b.wins - a.wins,
  );
}
