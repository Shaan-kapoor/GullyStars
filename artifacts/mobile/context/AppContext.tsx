import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Sport = "cricket" | "football" | "basketball";
export type UserRole = "player" | "captain" | "organiser" | "fan";

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  sport: Sport;
  avatar?: string;
  teamId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  sport: Sport;
  joinedAt: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  matches: number;
  cricket?: {
    runs: number;
    innings: number;
    highScore: number;
    wickets: number;
    ballsBowled: number;
    runsConceded: number;
  };
  football?: {
    goals: number;
    assists: number;
    appearances: number;
  };
  basketball?: {
    points: number;
    rebounds: number;
    assists: number;
    games: number;
  };
}

export interface Team {
  id: string;
  name: string;
  sport: Sport;
  captainId: string;
  isPublic: boolean;
  description: string;
  members: TeamMember[];
  joinRequests: string[];
  createdAt: string;
  location?: GeoLocation;
}

export interface TrainingSession {
  id: string;
  teamId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  createdBy: string;
  responses: Record<string, "going" | "not_going" | "maybe">;
}

export interface Match {
  id: string;
  teamId: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  sport: Sport;
  status: "upcoming" | "live" | "completed";
  rsvps: Record<string, "going" | "not_going" | "maybe">;
  score?: { home: number; away: number };
  result?: "win" | "loss" | "draw";
  tournamentId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  organiserId: string;
  format: "round-robin" | "bracket";
  status: "registration" | "ongoing" | "completed";
  teams: string[];
  fixtures: Fixture[];
  standings: Standing[];
  createdAt: string;
  location?: GeoLocation;
}

export interface Fixture {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  status: "scheduled" | "completed";
  score?: { home: number; away: number };
  round: number;
}

export interface Standing {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  points: number;
}

export interface FeedPost {
  id: string;
  teamId: string;
  teamName: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUri?: string;
  sport: Sport;
  likes: string[];
  createdAt: string;
  type: "result" | "training" | "general" | "milestone";
}

interface AppState {
  currentUser: User | null;
  teams: Team[];
  trainingSessions: TrainingSession[];
  matches: Match[];
  tournaments: Tournament[];
  feedPosts: FeedPost[];
  followedTeams: string[];
  hasOnboarded: boolean;
}

interface AppContextType extends AppState {
  setCurrentUser: (user: User | null) => void;
  createTeam: (team: Omit<Team, "id" | "members" | "joinRequests" | "createdAt">) => Team;
  joinTeam: (teamId: string) => void;
  requestJoinTeam: (teamId: string) => void;
  approveJoinRequest: (teamId: string, userId: string) => void;
  createTrainingSession: (session: Omit<TrainingSession, "id" | "responses">) => void;
  respondToTraining: (sessionId: string, response: "going" | "not_going" | "maybe") => void;
  createMatch: (match: Omit<Match, "id" | "rsvps" | "status">) => void;
  respondToMatch: (matchId: string, response: "going" | "not_going" | "maybe") => void;
  submitScore: (matchId: string, score: { home: number; away: number }) => void;
  createTournament: (tournament: Omit<Tournament, "id" | "teams" | "fixtures" | "standings" | "createdAt">) => void;
  applyToTournament: (tournamentId: string, teamId: string) => void;
  addFeedPost: (post: Omit<FeedPost, "id" | "likes" | "createdAt">) => void;
  likePost: (postId: string) => void;
  followTeam: (teamId: string) => void;
  unfollowTeam: (teamId: string) => void;
  completeOnboarding: (user: User) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const SEED_DATA: AppState = {
  hasOnboarded: false,
  currentUser: null,
  followedTeams: [],
  teams: [
    {
      id: "team-1",
      name: "Street Lions FC",
      sport: "football",
      captainId: "user-captain-1",
      isPublic: true,
      description: "The best street football crew in East End. Five-a-side champions 2024.",
      location: { lat: 51.5453, lng: -0.0558, address: "Hackney, East London" },
      members: [
        {
          id: "user-captain-1", name: "Raj Kumar", role: "captain", sport: "football", joinedAt: "2024-01-15",
          stats: { matches: 24, football: { goals: 12, assists: 8, appearances: 24 } },
        },
        {
          id: "user-p1", name: "Arjun Singh", role: "player", sport: "football", joinedAt: "2024-01-20",
          stats: { matches: 20, football: { goals: 8, assists: 5, appearances: 20 } },
        },
        {
          id: "user-p2", name: "Priya Sharma", role: "player", sport: "football", joinedAt: "2024-02-01",
          stats: { matches: 18, football: { goals: 3, assists: 11, appearances: 18 } },
        },
      ],
      joinRequests: [],
      createdAt: "2024-01-10",
    },
    {
      id: "team-2",
      name: "Thunder Crickets",
      sport: "cricket",
      captainId: "user-captain-2",
      isPublic: true,
      description: "Grassroots cricket club. Weekend warriors with serious game.",
      location: { lat: 51.4834, lng: -0.1143, address: "Kennington, South London" },
      members: [
        {
          id: "user-captain-2", name: "Mohammed Ali", role: "captain", sport: "cricket", joinedAt: "2024-01-05",
          stats: { matches: 15, cricket: { runs: 342, innings: 14, highScore: 64, wickets: 18, ballsBowled: 312, runsConceded: 276 } },
        },
        {
          id: "user-p3", name: "Deepa Nair", role: "player", sport: "cricket", joinedAt: "2024-01-25",
          stats: { matches: 12, cricket: { runs: 187, innings: 11, highScore: 64, wickets: 5, ballsBowled: 84, runsConceded: 98 } },
        },
      ],
      joinRequests: [],
      createdAt: "2024-01-01",
    },
    {
      id: "team-3",
      name: "Hoopsters United",
      sport: "basketball",
      captainId: "user-captain-3",
      isPublic: false,
      description: "3v3 and 5v5 basketball. Invite only. Competitive but fun.",
      location: { lat: 51.4613, lng: -0.1156, address: "Brixton, South London" },
      members: [
        {
          id: "user-captain-3", name: "James Okafor", role: "captain", sport: "basketball", joinedAt: "2024-02-01",
          stats: { matches: 22, basketball: { points: 287, rebounds: 145, assists: 98, games: 22 } },
        },
      ],
      joinRequests: [],
      createdAt: "2024-02-01",
    },
  ],
  trainingSessions: [
    {
      id: "ts-1",
      teamId: "team-1",
      title: "Pre-match warmup",
      date: "2026-04-20",
      time: "06:30",
      location: "Rec Ground, Gate 3",
      createdBy: "user-captain-1",
      responses: { "user-p1": "going", "user-p2": "maybe" },
    },
    {
      id: "ts-2",
      teamId: "team-2",
      title: "Batting nets session",
      date: "2026-04-19",
      time: "17:00",
      location: "Municipal Cricket Grounds",
      createdBy: "user-captain-2",
      responses: { "user-p3": "going" },
    },
  ],
  matches: [
    {
      id: "match-1",
      teamId: "team-1",
      opponent: "Red Devils",
      date: "2026-04-22",
      time: "10:00",
      location: "Community Grounds, Pitch B",
      sport: "football",
      status: "upcoming",
      rsvps: { "user-p1": "going", "user-p2": "going" },
    },
    {
      id: "match-2",
      teamId: "team-2",
      opponent: "Phoenix XI",
      date: "2026-04-12",
      time: "09:00",
      location: "Municipal Oval",
      sport: "cricket",
      status: "completed",
      rsvps: { "user-p3": "going" },
      score: { home: 187, away: 142 },
      result: "win",
    },
    {
      id: "match-3",
      teamId: "team-1",
      opponent: "City Warriors",
      date: "2026-04-08",
      time: "10:00",
      location: "Victoria Park Pitch 2",
      sport: "football",
      status: "completed",
      rsvps: { "user-p1": "going" },
      score: { home: 2, away: 2 },
      result: "draw",
    },
    {
      id: "match-4",
      teamId: "team-1",
      opponent: "Rapid Ravens",
      date: "2026-04-10",
      time: "10:00",
      location: "Gully Cup Venue",
      sport: "football",
      status: "completed",
      rsvps: { "user-p1": "going", "user-p2": "going" },
      score: { home: 3, away: 1 },
      result: "win",
      tournamentId: "tourn-1",
    },
  ],
  tournaments: [
    {
      id: "tourn-1",
      name: "Gully Cup 2026",
      sport: "football",
      organiserId: "user-org-1",
      format: "round-robin",
      status: "ongoing",
      location: { lat: 51.5354, lng: -0.0356, address: "Victoria Park, Tower Hamlets" },
      teams: ["team-1", "team-4", "team-5", "team-6"],
      fixtures: [
        { id: "fix-1", tournamentId: "tourn-1", homeTeamId: "team-1", awayTeamId: "team-4", homeTeamName: "Street Lions FC", awayTeamName: "Rapid Ravens", date: "2026-04-10", status: "completed", score: { home: 3, away: 1 }, round: 1 },
        { id: "fix-2", tournamentId: "tourn-1", homeTeamId: "team-5", awayTeamId: "team-6", homeTeamName: "Blazing Stars", awayTeamName: "Iron Wolves", date: "2026-04-10", status: "completed", score: { home: 2, away: 2 }, round: 1 },
        { id: "fix-3", tournamentId: "tourn-1", homeTeamId: "team-1", awayTeamId: "team-5", homeTeamName: "Street Lions FC", awayTeamName: "Blazing Stars", date: "2026-04-22", status: "scheduled", round: 2 },
        { id: "fix-4", tournamentId: "tourn-1", homeTeamId: "team-4", awayTeamId: "team-6", homeTeamName: "Rapid Ravens", awayTeamName: "Iron Wolves", date: "2026-04-22", status: "scheduled", round: 2 },
      ],
      standings: [
        { teamId: "team-1", teamName: "Street Lions FC", played: 1, won: 1, lost: 0, drawn: 0, points: 3 },
        { teamId: "team-5", teamName: "Blazing Stars", played: 1, won: 0, lost: 0, drawn: 1, points: 1 },
        { teamId: "team-6", teamName: "Iron Wolves", played: 1, won: 0, lost: 0, drawn: 1, points: 1 },
        { teamId: "team-4", teamName: "Rapid Ravens", played: 1, won: 0, lost: 1, drawn: 0, points: 0 },
      ],
      createdAt: "2026-04-01",
    },
  ],
  feedPosts: [
    {
      id: "fp-1",
      teamId: "team-2",
      teamName: "Thunder Crickets",
      authorId: "user-captain-2",
      authorName: "Mohammed Ali",
      content: "VICTORY! We chased down 143 with 5 overs to spare. Deepa's unbeaten 64 was electric. That's back-to-back wins!",
      sport: "cricket",
      likes: ["user-p1", "user-captain-3"],
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      type: "result",
    },
    {
      id: "fp-2",
      teamId: "team-1",
      teamName: "Street Lions FC",
      authorId: "user-captain-1",
      authorName: "Raj Kumar",
      content: "Training this Sunday 6:30am at Rec Ground. Come sharp, we've got the Gully Cup semifinal coming up!",
      sport: "football",
      likes: ["user-p2"],
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      type: "training",
    },
    {
      id: "fp-3",
      teamId: "team-3",
      teamName: "Hoopsters United",
      authorId: "user-captain-3",
      authorName: "James Okafor",
      content: "45 points in a 3v3 tournament. James O with 22, Sanjay with 14. Nobody could stop us today.",
      sport: "basketball",
      likes: ["user-p1", "user-p3", "user-captain-2"],
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      type: "result",
    },
  ],
};

const STORAGE_KEY = "gully_stars_state_v2";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(SEED_DATA);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          setState((prev) => ({ ...prev, ...saved }));
        } catch {}
      }
    });
  }, []);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((user: User) => {
    update((prev) => ({ ...prev, currentUser: user, hasOnboarded: true }));
  }, [update]);

  const setCurrentUser = useCallback((user: User | null) => {
    update((prev) => ({ ...prev, currentUser: user }));
  }, [update]);

  const createTeam = useCallback((team: Omit<Team, "id" | "members" | "joinRequests" | "createdAt">) => {
    const newTeam: Team = { ...team, id: generateId(), members: [], joinRequests: [], createdAt: new Date().toISOString() };
    if (state.currentUser) {
      const member: TeamMember = {
        id: state.currentUser.id,
        name: state.currentUser.name,
        role: "captain",
        sport: team.sport,
        joinedAt: new Date().toISOString(),
        stats: { matches: 0 },
      };
      newTeam.members = [member];
    }
    update((prev) => ({ ...prev, teams: [...prev.teams, newTeam] }));
    return newTeam;
  }, [state.currentUser, update]);

  const joinTeam = useCallback((teamId: string) => {
    if (!state.currentUser) return;
    update((prev) => {
      const member: TeamMember = {
        id: prev.currentUser!.id,
        name: prev.currentUser!.name,
        role: "player",
        sport: prev.teams.find((t) => t.id === teamId)?.sport ?? "football",
        joinedAt: new Date().toISOString(),
        stats: { matches: 0 },
      };
      return {
        ...prev,
        teams: prev.teams.map((t) =>
          t.id === teamId && !t.members.find((m) => m.id === prev.currentUser!.id)
            ? { ...t, members: [...t.members, member] }
            : t
        ),
        currentUser: { ...prev.currentUser!, teamId },
      };
    });
  }, [state.currentUser, update]);

  const requestJoinTeam = useCallback((teamId: string) => {
    if (!state.currentUser) return;
    update((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === teamId && !t.joinRequests.includes(prev.currentUser!.id)
          ? { ...t, joinRequests: [...t.joinRequests, prev.currentUser!.id] }
          : t
      ),
    }));
  }, [state.currentUser, update]);

  const approveJoinRequest = useCallback((teamId: string, userId: string) => {
    update((prev) => {
      const team = prev.teams.find((t) => t.id === teamId);
      if (!team) return prev;
      const member: TeamMember = {
        id: userId, name: userId, role: "player", sport: team.sport,
        joinedAt: new Date().toISOString(), stats: { matches: 0 },
      };
      return {
        ...prev,
        teams: prev.teams.map((t) =>
          t.id === teamId
            ? { ...t, members: [...t.members, member], joinRequests: t.joinRequests.filter((id) => id !== userId) }
            : t
        ),
      };
    });
  }, [update]);

  const createTrainingSession = useCallback((session: Omit<TrainingSession, "id" | "responses">) => {
    update((prev) => ({
      ...prev,
      trainingSessions: [...prev.trainingSessions, { ...session, id: generateId(), responses: {} }],
    }));
  }, [update]);

  const respondToTraining = useCallback((sessionId: string, response: "going" | "not_going" | "maybe") => {
    if (!state.currentUser) return;
    update((prev) => ({
      ...prev,
      trainingSessions: prev.trainingSessions.map((s) =>
        s.id === sessionId ? { ...s, responses: { ...s.responses, [prev.currentUser!.id]: response } } : s
      ),
    }));
  }, [state.currentUser, update]);

  const createMatch = useCallback((match: Omit<Match, "id" | "rsvps" | "status">) => {
    update((prev) => ({
      ...prev,
      matches: [...prev.matches, { ...match, id: generateId(), rsvps: {}, status: "upcoming" }],
    }));
  }, [update]);

  const respondToMatch = useCallback((matchId: string, response: "going" | "not_going" | "maybe") => {
    if (!state.currentUser) return;
    update((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId ? { ...m, rsvps: { ...m.rsvps, [prev.currentUser!.id]: response } } : m
      ),
    }));
  }, [state.currentUser, update]);

  const submitScore = useCallback((matchId: string, score: { home: number; away: number }) => {
    update((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        const result: "win" | "loss" | "draw" =
          score.home > score.away ? "win" : score.home < score.away ? "loss" : "draw";
        return { ...m, score, result, status: "completed" };
      }),
    }));
  }, [update]);

  const createTournament = useCallback((tournament: Omit<Tournament, "id" | "teams" | "fixtures" | "standings" | "createdAt">) => {
    update((prev) => ({
      ...prev,
      tournaments: [
        ...prev.tournaments,
        { ...tournament, id: generateId(), teams: [], fixtures: [], standings: [], createdAt: new Date().toISOString() },
      ],
    }));
  }, [update]);

  const applyToTournament = useCallback((tournamentId: string, teamId: string) => {
    update((prev) => ({
      ...prev,
      tournaments: prev.tournaments.map((t) =>
        t.id === tournamentId && !t.teams.includes(teamId) ? { ...t, teams: [...t.teams, teamId] } : t
      ),
    }));
  }, [update]);

  const addFeedPost = useCallback((post: Omit<FeedPost, "id" | "likes" | "createdAt">) => {
    update((prev) => ({
      ...prev,
      feedPosts: [{ ...post, id: generateId(), likes: [], createdAt: new Date().toISOString() }, ...prev.feedPosts],
    }));
  }, [update]);

  const likePost = useCallback((postId: string) => {
    if (!state.currentUser) return;
    update((prev) => ({
      ...prev,
      feedPosts: prev.feedPosts.map((p) => {
        if (p.id !== postId) return p;
        const liked = p.likes.includes(prev.currentUser!.id);
        return { ...p, likes: liked ? p.likes.filter((id) => id !== prev.currentUser!.id) : [...p.likes, prev.currentUser!.id] };
      }),
    }));
  }, [state.currentUser, update]);

  const followTeam = useCallback((teamId: string) => {
    update((prev) => ({
      ...prev,
      followedTeams: prev.followedTeams.includes(teamId) ? prev.followedTeams : [...prev.followedTeams, teamId],
    }));
  }, [update]);

  const unfollowTeam = useCallback((teamId: string) => {
    update((prev) => ({ ...prev, followedTeams: prev.followedTeams.filter((id) => id !== teamId) }));
  }, [update]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setCurrentUser, createTeam, joinTeam, requestJoinTeam, approveJoinRequest,
        createTrainingSession, respondToTraining, createMatch, respondToMatch, submitScore,
        createTournament, applyToTournament, addFeedPost, likePost, followTeam, unfollowTeam,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
