import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  loading: boolean;
}

interface AppContextType extends AppState {
  setCurrentUser: (user: User | null) => void;
  createTeam: (team: Omit<Team, "id" | "members" | "joinRequests" | "createdAt">) => Promise<Team>;
  joinTeam: (teamId: string) => void;
  requestJoinTeam: (teamId: string) => void;
  approveJoinRequest: (teamId: string, userId: string) => void;
  createTrainingSession: (session: Omit<TrainingSession, "id" | "responses">) => Promise<void>;
  respondToTraining: (sessionId: string, response: "going" | "not_going" | "maybe") => Promise<void>;
  createMatch: (match: Omit<Match, "id" | "rsvps" | "status">) => Promise<void>;
  respondToMatch: (matchId: string, response: "going" | "not_going" | "maybe") => Promise<void>;
  submitScore: (matchId: string, score: { home: number; away: number }) => Promise<void>;
  createTournament: (tournament: Omit<Tournament, "id" | "teams" | "fixtures" | "standings" | "createdAt">) => Promise<void>;
  applyToTournament: (tournamentId: string, teamId: string) => Promise<void>;
  addFeedPost: (post: Omit<FeedPost, "id" | "likes" | "createdAt">) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  followTeam: (teamId: string) => void;
  unfollowTeam: (teamId: string) => void;
  completeOnboarding: (user: User) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);
const USER_KEY = "gully_stars_user_v3";

const SEED_TEAMS: Omit<Team, never>[] = [
  {
    id: "team-1",
    name: "Street Lions FC",
    sport: "football",
    captainId: "seed-captain-1",
    isPublic: true,
    description: "The best street football crew in East End. Five-a-side champions 2024.",
    location: { lat: 51.5453, lng: -0.0558, address: "Hackney, East London" },
    members: [
      { id: "seed-captain-1", name: "Raj Kumar", role: "captain", sport: "football", joinedAt: "2024-01-15", stats: { matches: 24, football: { goals: 12, assists: 8, appearances: 24 } } },
      { id: "seed-p1", name: "Arjun Singh", role: "player", sport: "football", joinedAt: "2024-01-20", stats: { matches: 20, football: { goals: 8, assists: 5, appearances: 20 } } },
      { id: "seed-p2", name: "Priya Sharma", role: "player", sport: "football", joinedAt: "2024-02-01", stats: { matches: 18, football: { goals: 3, assists: 11, appearances: 18 } } },
    ],
    joinRequests: [],
    createdAt: "2024-01-10",
  },
  {
    id: "team-2",
    name: "Thunder Crickets",
    sport: "cricket",
    captainId: "seed-captain-2",
    isPublic: true,
    description: "Grassroots cricket club. Weekend warriors with serious game.",
    location: { lat: 51.4834, lng: -0.1143, address: "Kennington, South London" },
    members: [
      { id: "seed-captain-2", name: "Mohammed Ali", role: "captain", sport: "cricket", joinedAt: "2024-01-05", stats: { matches: 15, cricket: { runs: 342, innings: 14, highScore: 64, wickets: 18, ballsBowled: 312, runsConceded: 276 } } },
      { id: "seed-p3", name: "Deepa Nair", role: "player", sport: "cricket", joinedAt: "2024-01-25", stats: { matches: 12, cricket: { runs: 187, innings: 11, highScore: 64, wickets: 5, ballsBowled: 84, runsConceded: 98 } } },
    ],
    joinRequests: [],
    createdAt: "2024-01-01",
  },
  {
    id: "team-3",
    name: "Hoopsters United",
    sport: "basketball",
    captainId: "seed-captain-3",
    isPublic: false,
    description: "3v3 and 5v5 basketball. Invite only. Competitive but fun.",
    location: { lat: 51.4613, lng: -0.1156, address: "Brixton, South London" },
    members: [
      { id: "seed-captain-3", name: "James Okafor", role: "captain", sport: "basketball", joinedAt: "2024-02-01", stats: { matches: 22, basketball: { points: 287, rebounds: 145, assists: 98, games: 22 } } },
    ],
    joinRequests: [],
    createdAt: "2024-02-01",
  },
];

const SEED_POSTS: Omit<FeedPost, never>[] = [
  { id: "seed-fp-1", teamId: "team-2", teamName: "Thunder Crickets", authorId: "seed-captain-2", authorName: "Mohammed Ali", content: "VICTORY! We chased down 143 with 5 overs to spare. Deepa's unbeaten 64 was electric. That's back-to-back wins!", sport: "cricket", likes: ["seed-p1", "seed-captain-3"], createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), type: "result" },
  { id: "seed-fp-2", teamId: "team-1", teamName: "Street Lions FC", authorId: "seed-captain-1", authorName: "Raj Kumar", content: "Training this Sunday 6:30am at Rec Ground. Come sharp, we've got the Gully Cup semifinal coming up!", sport: "football", likes: ["seed-p2"], createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), type: "training" },
  { id: "seed-fp-3", teamId: "team-3", teamName: "Hoopsters United", authorId: "seed-captain-3", authorName: "James Okafor", content: "45 points in a 3v3 tournament. James O with 22, Sanjay with 14. Nobody could stop us today.", sport: "basketball", likes: ["seed-p1", "seed-p3", "seed-captain-2"], createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), type: "result" },
];

const SEED_TRAINING: TrainingSession[] = [
  { id: "seed-ts-1", teamId: "team-1", title: "Pre-match warmup", date: "2026-04-20", time: "06:30", location: "Rec Ground, Gate 3", createdBy: "seed-captain-1", responses: { "seed-p1": "going", "seed-p2": "maybe" } },
  { id: "seed-ts-2", teamId: "team-2", title: "Batting nets session", date: "2026-04-19", time: "17:00", location: "Municipal Cricket Grounds", createdBy: "seed-captain-2", responses: { "seed-p3": "going" } },
];

const SEED_MATCHES: Match[] = [
  { id: "seed-match-1", teamId: "team-1", opponent: "Red Devils", date: "2026-04-22", time: "10:00", location: "Community Grounds, Pitch B", sport: "football", status: "upcoming", rsvps: { "seed-p1": "going", "seed-p2": "going" } },
  { id: "seed-match-2", teamId: "team-2", opponent: "Phoenix XI", date: "2026-04-12", time: "09:00", location: "Municipal Oval", sport: "cricket", status: "completed", rsvps: { "seed-p3": "going" }, score: { home: 187, away: 142 }, result: "win" },
  { id: "seed-match-3", teamId: "team-1", opponent: "City Warriors", date: "2026-04-08", time: "10:00", location: "Victoria Park Pitch 2", sport: "football", status: "completed", rsvps: { "seed-p1": "going" }, score: { home: 2, away: 2 }, result: "draw" },
  { id: "seed-match-4", teamId: "team-1", opponent: "Rapid Ravens", date: "2026-04-10", time: "10:00", location: "Gully Cup Venue", sport: "football", status: "completed", rsvps: { "seed-p1": "going", "seed-p2": "going" }, score: { home: 3, away: 1 }, result: "win", tournamentId: "seed-tourn-1" },
];

const SEED_TOURNAMENTS: Tournament[] = [
  {
    id: "seed-tourn-1",
    name: "Gully Cup 2026",
    sport: "football",
    organiserId: "seed-org-1",
    format: "round-robin",
    status: "ongoing",
    location: { lat: 51.5354, lng: -0.0356, address: "Victoria Park, Tower Hamlets" },
    teams: ["team-1", "team-4", "team-5", "team-6"],
    fixtures: [
      { id: "seed-fix-1", tournamentId: "seed-tourn-1", homeTeamId: "team-1", awayTeamId: "team-4", homeTeamName: "Street Lions FC", awayTeamName: "Rapid Ravens", date: "2026-04-10", status: "completed", score: { home: 3, away: 1 }, round: 1 },
      { id: "seed-fix-2", tournamentId: "seed-tourn-1", homeTeamId: "team-5", awayTeamId: "team-6", homeTeamName: "Blazing Stars", awayTeamName: "Iron Wolves", date: "2026-04-10", status: "completed", score: { home: 2, away: 2 }, round: 1 },
      { id: "seed-fix-3", tournamentId: "seed-tourn-1", homeTeamId: "team-1", awayTeamId: "team-5", homeTeamName: "Street Lions FC", awayTeamName: "Blazing Stars", date: "2026-04-22", status: "scheduled", round: 2 },
      { id: "seed-fix-4", tournamentId: "seed-tourn-1", homeTeamId: "team-4", awayTeamId: "team-6", homeTeamName: "Rapid Ravens", awayTeamName: "Iron Wolves", date: "2026-04-22", status: "scheduled", round: 2 },
    ],
    standings: [
      { teamId: "team-1", teamName: "Street Lions FC", played: 1, won: 1, lost: 0, drawn: 0, points: 3 },
      { teamId: "team-5", teamName: "Blazing Stars", played: 1, won: 0, lost: 0, drawn: 1, points: 1 },
      { teamId: "team-6", teamName: "Iron Wolves", played: 1, won: 0, lost: 0, drawn: 1, points: 1 },
      { teamId: "team-4", teamName: "Rapid Ravens", played: 1, won: 0, lost: 1, drawn: 0, points: 0 },
    ],
    createdAt: "2026-04-01",
  },
];

function rowToTeam(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    captainId: row.captain_id,
    isPublic: row.is_public,
    description: row.description ?? "",
    members: row.members ?? [],
    joinRequests: row.join_requests ?? [],
    createdAt: row.created_at,
    location: row.location ?? undefined,
  };
}

function rowToPost(row: any): FeedPost {
  return {
    id: row.id,
    teamId: row.team_id,
    teamName: row.team_name,
    authorId: row.author_id,
    authorName: row.author_name,
    content: row.content,
    imageUri: row.image_url ?? undefined,
    sport: row.sport,
    likes: row.likes ?? [],
    createdAt: row.created_at,
    type: row.type,
  };
}

function rowToTraining(row: any): TrainingSession {
  return {
    id: row.id,
    teamId: row.team_id,
    title: row.title,
    date: row.date,
    time: row.time,
    location: row.location,
    createdBy: row.created_by,
    responses: row.responses ?? {},
  };
}

function rowToMatch(row: any): Match {
  return {
    id: row.id,
    teamId: row.team_id,
    opponent: row.opponent,
    date: row.date,
    time: row.time,
    location: row.location,
    sport: row.sport,
    status: row.status,
    rsvps: row.rsvps ?? {},
    score: row.score ?? undefined,
    result: row.result ?? undefined,
    tournamentId: row.tournament_id ?? undefined,
  };
}

function rowToTournament(row: any): Tournament {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    organiserId: row.organiser_id,
    format: row.format,
    status: row.status,
    teams: row.teams ?? [],
    fixtures: row.fixtures ?? [],
    standings: row.standings ?? [],
    createdAt: row.created_at,
    location: row.location ?? undefined,
  };
}

async function seedIfEmpty() {
  const { count: teamCount } = await supabase.from("teams").select("*", { count: "exact", head: true });
  if ((teamCount ?? 0) > 0) return;

  await supabase.from("teams").insert(
    SEED_TEAMS.map((t) => ({
      id: t.id,
      name: t.name,
      sport: t.sport,
      captain_id: t.captainId,
      is_public: t.isPublic,
      description: t.description,
      members: t.members,
      join_requests: t.joinRequests,
      location: t.location ?? null,
    }))
  );

  await supabase.from("feed_posts").insert(
    SEED_POSTS.map((p) => ({
      id: p.id,
      team_id: p.teamId,
      team_name: p.teamName,
      author_id: p.authorId,
      author_name: p.authorName,
      content: p.content,
      image_url: p.imageUri ?? null,
      sport: p.sport,
      likes: p.likes,
      type: p.type,
    }))
  );

  await supabase.from("training_sessions").insert(
    SEED_TRAINING.map((s) => ({
      id: s.id,
      team_id: s.teamId,
      title: s.title,
      date: s.date,
      time: s.time,
      location: s.location,
      created_by: s.createdBy,
      responses: s.responses,
    }))
  );

  await supabase.from("matches").insert(
    SEED_MATCHES.map((m) => ({
      id: m.id,
      team_id: m.teamId,
      opponent: m.opponent,
      date: m.date,
      time: m.time,
      location: m.location,
      sport: m.sport,
      status: m.status,
      rsvps: m.rsvps,
      score: m.score ?? null,
      result: m.result ?? null,
      tournament_id: m.tournamentId ?? null,
    }))
  );

  await supabase.from("tournaments").insert(
    SEED_TOURNAMENTS.map((t) => ({
      id: t.id,
      name: t.name,
      sport: t.sport,
      organiser_id: t.organiserId,
      format: t.format,
      status: t.status,
      teams: t.teams,
      fixtures: t.fixtures,
      standings: t.standings,
      location: t.location ?? null,
    }))
  );
}

async function loadAllData() {
  const [teamsRes, postsRes, trainingRes, matchesRes, tournamentsRes] = await Promise.all([
    supabase.from("teams").select("*").order("created_at", { ascending: false }),
    supabase.from("feed_posts").select("*").order("created_at", { ascending: false }),
    supabase.from("training_sessions").select("*").order("date", { ascending: true }),
    supabase.from("matches").select("*").order("date", { ascending: false }),
    supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    teams: (teamsRes.data ?? []).map(rowToTeam),
    feedPosts: (postsRes.data ?? []).map(rowToPost),
    trainingSessions: (trainingRes.data ?? []).map(rowToTraining),
    matches: (matchesRes.data ?? []).map(rowToMatch),
    tournaments: (tournamentsRes.data ?? []).map(rowToTournament),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    teams: [],
    trainingSessions: [],
    matches: [],
    tournaments: [],
    feedPosts: [],
    followedTeams: [],
    hasOnboarded: false,
    loading: true,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    async function init() {
      const [userRaw, followedRaw] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem("gully_stars_followed_v1"),
      ]);

      let currentUser: User | null = null;
      let hasOnboarded = false;
      let followedTeams: string[] = [];

      if (userRaw) {
        try { const parsed = JSON.parse(userRaw); currentUser = parsed.user ?? null; hasOnboarded = parsed.hasOnboarded ?? false; } catch {}
      }
      if (followedRaw) {
        try { followedTeams = JSON.parse(followedRaw); } catch {}
      }

      await seedIfEmpty();
      const data = await loadAllData();

      setState((prev) => ({ ...prev, ...data, currentUser, hasOnboarded, followedTeams, loading: false }));
    }
    init().catch(console.error);
  }, []);

  const saveUserLocally = useCallback(async (user: User | null, onboarded: boolean) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify({ user, hasOnboarded: onboarded }));
  }, []);

  const refreshData = useCallback(async () => {
    const data = await loadAllData();
    setState((prev) => ({ ...prev, ...data }));
  }, []);

  const completeOnboarding = useCallback(async (user: User) => {
    await supabase.from("users").upsert({ id: user.id, name: user.name, role: user.role, sport: user.sport }, { onConflict: "id" });
    await saveUserLocally(user, true);
    setState((prev) => ({ ...prev, currentUser: user, hasOnboarded: true }));
  }, [saveUserLocally]);

  const setCurrentUser = useCallback((user: User | null) => {
    saveUserLocally(user, stateRef.current.hasOnboarded);
    setState((prev) => ({ ...prev, currentUser: user }));
  }, [saveUserLocally]);

  const createTeam = useCallback(async (team: Omit<Team, "id" | "members" | "joinRequests" | "createdAt">) => {
    const cur = stateRef.current.currentUser;
    const newTeam: Team = { ...team, id: generateId(), members: [], joinRequests: [], createdAt: new Date().toISOString() };
    if (cur) {
      newTeam.members = [{ id: cur.id, name: cur.name, role: "captain", sport: team.sport, joinedAt: new Date().toISOString(), stats: { matches: 0 } }];
    }
    await supabase.from("teams").insert({
      id: newTeam.id, name: newTeam.name, sport: newTeam.sport, captain_id: newTeam.captainId,
      is_public: newTeam.isPublic, description: newTeam.description, members: newTeam.members,
      join_requests: [], location: newTeam.location ?? null,
    });
    setState((prev) => ({ ...prev, teams: [newTeam, ...prev.teams] }));
    return newTeam;
  }, []);

  const joinTeam = useCallback((teamId: string) => {
    const cur = stateRef.current.currentUser;
    if (!cur) return;
    const team = stateRef.current.teams.find((t) => t.id === teamId);
    const member: TeamMember = { id: cur.id, name: cur.name, role: "player", sport: team?.sport ?? "football", joinedAt: new Date().toISOString(), stats: { matches: 0 } };
    setState((prev) => {
      const updated = prev.teams.map((t) =>
        t.id === teamId && !t.members.find((m) => m.id === cur.id) ? { ...t, members: [...t.members, member] } : t
      );
      const updatedTeam = updated.find((t) => t.id === teamId);
      if (updatedTeam) supabase.from("teams").update({ members: updatedTeam.members }).eq("id", teamId);
      return { ...prev, teams: updated, currentUser: { ...cur, teamId } };
    });
    saveUserLocally({ ...cur, teamId }, stateRef.current.hasOnboarded);
  }, [saveUserLocally]);

  const requestJoinTeam = useCallback((teamId: string) => {
    const cur = stateRef.current.currentUser;
    if (!cur) return;
    setState((prev) => {
      const updated = prev.teams.map((t) =>
        t.id === teamId && !t.joinRequests.includes(cur.id) ? { ...t, joinRequests: [...t.joinRequests, cur.id] } : t
      );
      const updatedTeam = updated.find((t) => t.id === teamId);
      if (updatedTeam) supabase.from("teams").update({ join_requests: updatedTeam.joinRequests }).eq("id", teamId);
      return { ...prev, teams: updated };
    });
  }, []);

  const approveJoinRequest = useCallback((teamId: string, userId: string) => {
    setState((prev) => {
      const team = prev.teams.find((t) => t.id === teamId);
      if (!team) return prev;
      const member: TeamMember = { id: userId, name: userId, role: "player", sport: team.sport, joinedAt: new Date().toISOString(), stats: { matches: 0 } };
      const updated = prev.teams.map((t) =>
        t.id === teamId ? { ...t, members: [...t.members, member], joinRequests: t.joinRequests.filter((id) => id !== userId) } : t
      );
      const updatedTeam = updated.find((t) => t.id === teamId);
      if (updatedTeam) supabase.from("teams").update({ members: updatedTeam.members, join_requests: updatedTeam.joinRequests }).eq("id", teamId);
      return { ...prev, teams: updated };
    });
  }, []);

  const createTrainingSession = useCallback(async (session: Omit<TrainingSession, "id" | "responses">) => {
    const newSession: TrainingSession = { ...session, id: generateId(), responses: {} };
    await supabase.from("training_sessions").insert({
      id: newSession.id, team_id: newSession.teamId, title: newSession.title,
      date: newSession.date, time: newSession.time, location: newSession.location,
      created_by: newSession.createdBy, responses: {},
    });
    setState((prev) => ({ ...prev, trainingSessions: [...prev.trainingSessions, newSession] }));
  }, []);

  const respondToTraining = useCallback(async (sessionId: string, response: "going" | "not_going" | "maybe") => {
    const cur = stateRef.current.currentUser;
    if (!cur) return;
    setState((prev) => {
      const updated = prev.trainingSessions.map((s) => {
        if (s.id !== sessionId) return s;
        const newResponses = { ...s.responses, [cur.id]: response };
        supabase.from("training_sessions").update({ responses: newResponses }).eq("id", sessionId);
        return { ...s, responses: newResponses };
      });
      return { ...prev, trainingSessions: updated };
    });
  }, []);

  const createMatch = useCallback(async (match: Omit<Match, "id" | "rsvps" | "status">) => {
    const newMatch: Match = { ...match, id: generateId(), rsvps: {}, status: "upcoming" };
    await supabase.from("matches").insert({
      id: newMatch.id, team_id: newMatch.teamId, opponent: newMatch.opponent, date: newMatch.date,
      time: newMatch.time, location: newMatch.location, sport: newMatch.sport, status: "upcoming",
      rsvps: {}, score: null, result: null, tournament_id: newMatch.tournamentId ?? null,
    });
    setState((prev) => ({ ...prev, matches: [newMatch, ...prev.matches] }));
  }, []);

  const respondToMatch = useCallback(async (matchId: string, response: "going" | "not_going" | "maybe") => {
    const cur = stateRef.current.currentUser;
    if (!cur) return;
    setState((prev) => {
      const updated = prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        const newRsvps = { ...m.rsvps, [cur.id]: response };
        supabase.from("matches").update({ rsvps: newRsvps }).eq("id", matchId);
        return { ...m, rsvps: newRsvps };
      });
      return { ...prev, matches: updated };
    });
  }, []);

  const submitScore = useCallback(async (matchId: string, score: { home: number; away: number }) => {
    const result: "win" | "loss" | "draw" = score.home > score.away ? "win" : score.home < score.away ? "loss" : "draw";
    await supabase.from("matches").update({ score, result, status: "completed" }).eq("id", matchId);
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => m.id !== matchId ? m : { ...m, score, result, status: "completed" }),
    }));
  }, []);

  const createTournament = useCallback(async (tournament: Omit<Tournament, "id" | "teams" | "fixtures" | "standings" | "createdAt">) => {
    const newT: Tournament = { ...tournament, id: generateId(), teams: [], fixtures: [], standings: [], createdAt: new Date().toISOString() };
    await supabase.from("tournaments").insert({
      id: newT.id, name: newT.name, sport: newT.sport, organiser_id: newT.organiserId,
      format: newT.format, status: newT.status, teams: [], fixtures: [], standings: [],
      location: newT.location ?? null,
    });
    setState((prev) => ({ ...prev, tournaments: [newT, ...prev.tournaments] }));
  }, []);

  const applyToTournament = useCallback(async (tournamentId: string, teamId: string) => {
    setState((prev) => {
      const updated = prev.tournaments.map((t) => {
        if (t.id !== tournamentId || t.teams.includes(teamId)) return t;
        const newTeams = [...t.teams, teamId];
        supabase.from("tournaments").update({ teams: newTeams }).eq("id", tournamentId);
        return { ...t, teams: newTeams };
      });
      return { ...prev, tournaments: updated };
    });
  }, []);

  const addFeedPost = useCallback(async (post: Omit<FeedPost, "id" | "likes" | "createdAt">) => {
    const newPost: FeedPost = { ...post, id: generateId(), likes: [], createdAt: new Date().toISOString() };
    await supabase.from("feed_posts").insert({
      id: newPost.id, team_id: newPost.teamId, team_name: newPost.teamName,
      author_id: newPost.authorId, author_name: newPost.authorName, content: newPost.content,
      image_url: newPost.imageUri ?? null, sport: newPost.sport, likes: [], type: newPost.type,
    });
    setState((prev) => ({ ...prev, feedPosts: [newPost, ...prev.feedPosts] }));
  }, []);

  const likePost = useCallback(async (postId: string) => {
    const cur = stateRef.current.currentUser;
    if (!cur) return;
    setState((prev) => {
      const updated = prev.feedPosts.map((p) => {
        if (p.id !== postId) return p;
        const liked = p.likes.includes(cur.id);
        const newLikes = liked ? p.likes.filter((id) => id !== cur.id) : [...p.likes, cur.id];
        supabase.from("feed_posts").update({ likes: newLikes }).eq("id", postId);
        return { ...p, likes: newLikes };
      });
      return { ...prev, feedPosts: updated };
    });
  }, []);

  const followTeam = useCallback((teamId: string) => {
    setState((prev) => {
      if (prev.followedTeams.includes(teamId)) return prev;
      const updated = [...prev.followedTeams, teamId];
      AsyncStorage.setItem("gully_stars_followed_v1", JSON.stringify(updated));
      return { ...prev, followedTeams: updated };
    });
  }, []);

  const unfollowTeam = useCallback((teamId: string) => {
    setState((prev) => {
      const updated = prev.followedTeams.filter((id) => id !== teamId);
      AsyncStorage.setItem("gully_stars_followed_v1", JSON.stringify(updated));
      return { ...prev, followedTeams: updated };
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setCurrentUser, createTeam, joinTeam, requestJoinTeam, approveJoinRequest,
        createTrainingSession, respondToTraining, createMatch, respondToMatch, submitScore,
        createTournament, applyToTournament, addFeedPost, likePost, followTeam, unfollowTeam,
        completeOnboarding, refreshData,
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
