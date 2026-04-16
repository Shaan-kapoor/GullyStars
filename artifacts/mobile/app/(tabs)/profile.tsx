import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoleChip } from "@/components/RoleChip";
import { SportBadge, sportColor } from "@/components/SportBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function fmt(n: number, decimals = 1) {
  return Number.isFinite(n) && !Number.isNaN(n) ? n.toFixed(decimals) : "—";
}

function FormDot({ result }: { result?: "win" | "loss" | "draw" }) {
  const colors = useColors();
  const bg = result === "win" ? "#00C896" : result === "loss" ? "#EF4444" : result === "draw" ? "#FFB800" : colors.secondary;
  const label = result === "win" ? "W" : result === "loss" ? "L" : result === "draw" ? "D" : "?";
  return (
    <View style={[styles.formDot, { backgroundColor: bg }]}>
      <Text style={styles.formLabel}>{label}</Text>
    </View>
  );
}

function BigStat({ value, label, sub, color }: { value: string; label: string; sub?: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.bigStatWrap}>
      <Text style={[styles.bigStatValue, { color }]}>{value}</Text>
      <Text style={[styles.bigStatLabel, { color: colors.foreground }]}>{label}</Text>
      {sub && <Text style={[styles.bigStatSub, { color: colors.mutedForeground }]}>{sub}</Text>}
    </View>
  );
}

function StatRow({ label, value, color, highlight }: { label: string; value: string; color?: string; highlight?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.statRow, highlight && { backgroundColor: colors.secondary, borderRadius: 10 }]}>
      <Text style={[styles.statRowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statRowValue, { color: color ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, teams, matches, trainingSessions, setCurrentUser } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentUser) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad + 40, alignItems: "center" }]}>
        <Text style={[styles.noUser, { color: colors.mutedForeground }]}>Complete onboarding to see your profile.</Text>
      </View>
    );
  }

  const myTeam = teams.find((t) => t.members.some((m) => m.id === currentUser.id));
  const myMember = myTeam?.members.find((m) => m.id === currentUser.id);
  const sc = sportColor(currentUser.sport);
  const stats = myMember?.stats;

  const myMatches = matches
    .filter((m) => m.teamId === myTeam?.id && m.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const myTraining = trainingSessions.filter((s) => s.teamId === myTeam?.id);
  const totalSessions = myTraining.length;
  const attended = myTraining.filter((s) => s.responses[currentUser.id] === "going").length;
  const attendanceRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

  const wins = myMatches.filter((m) => m.result === "win").length;
  const totalCompleted = myMatches.length;
  const winRate = totalCompleted > 0 ? Math.round((wins / totalCompleted) * 100) : 0;

  const last5 = myMatches.slice(0, 5).reverse();

  const handleSignOut = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    AsyncStorage.removeItem("gully_stars_state_v2");
    setCurrentUser(null);
    router.replace("/onboarding");
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: topPad + 20, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarRing, { borderColor: sc }]}>
          <View style={[styles.avatar, { backgroundColor: sc + "33" }]}>
            <Text style={[styles.avatarInitial, { color: sc }]}>{currentUser.name[0]}</Text>
          </View>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{currentUser.name}</Text>
        <View style={styles.chips}>
          <RoleChip role={currentUser.role} />
          <SportBadge sport={currentUser.sport} size="md" />
        </View>
        {myTeam ? (
          <Pressable
            style={[styles.teamBadge, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/team/[id]", params: { id: myTeam.id } })}
          >
            <View style={[styles.teamDot, { backgroundColor: sc }]} />
            <Text style={[styles.teamBadgeText, { color: colors.foreground }]}>{myTeam.name}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.noTeamBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/teams")}
          >
            <Text style={[styles.noTeamText, { color: colors.primary }]}>Find a team to join</Text>
          </Pressable>
        )}
      </View>

      {last5.length > 0 && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Form Guide</Text>
          <View style={styles.formRow}>
            {last5.map((m, i) => <FormDot key={i} result={m.result} />)}
            {last5.length < 5 && Array.from({ length: 5 - last5.length }).map((_, i) => <FormDot key={"empty" + i} />)}
          </View>
          <Text style={[styles.formSub, { color: colors.mutedForeground }]}>Last 5 matches</Text>
        </View>
      )}

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Season Overview</Text>
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.overviewVal, { color: colors.primary }]}>{stats?.matches ?? 0}</Text>
            <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Matches</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.overviewVal, { color: winRate >= 50 ? "#00C896" : "#EF4444" }]}>{winRate}%</Text>
            <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Win Rate</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.overviewVal, { color: attendanceRate >= 70 ? "#00C896" : colors.accent }]}>{attendanceRate}%</Text>
            <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Attendance</Text>
          </View>
        </View>
      </View>

      {currentUser.sport === "cricket" && stats?.cricket && (() => {
        const s = stats.cricket;
        const battingAvg = s.innings > 0 ? s.runs / s.innings : 0;
        const economy = s.ballsBowled > 0 ? (s.runsConceded / (s.ballsBowled / 6)) : 0;
        const bowlingAvg = s.wickets > 0 ? s.runsConceded / s.wickets : 0;
        return (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Cricket</Text>
            <View style={styles.bigStatsRow}>
              <BigStat value={fmt(battingAvg)} label="Batting Avg" sub={`${s.runs} runs in ${s.innings} innings`} color={sc} />
              <View style={[styles.bigStatDivider, { backgroundColor: colors.border }]} />
              <BigStat value={String(s.wickets)} label="Wickets" sub={`Avg ${fmt(bowlingAvg)}`} color="#A855F7" />
            </View>
            <View style={[styles.statsList, { borderColor: colors.border }]}>
              <StatRow label="Highest Score" value={String(s.highScore)} color={sc} highlight />
              <StatRow label="Total Runs" value={String(s.runs)} />
              <StatRow label="Economy Rate" value={fmt(economy)} />
              <StatRow label="Balls Bowled" value={String(s.ballsBowled)} />
            </View>
          </View>
        );
      })()}

      {currentUser.sport === "football" && stats?.football && (() => {
        const s = stats.football;
        const gpg = s.appearances > 0 ? s.goals / s.appearances : 0;
        const contributions = s.goals + s.assists;
        return (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Football</Text>
            <View style={styles.bigStatsRow}>
              <BigStat value={fmt(gpg)} label="Goals / Game" sub={`${s.goals} goals total`} color={sc} />
              <View style={[styles.bigStatDivider, { backgroundColor: colors.border }]} />
              <BigStat value={String(contributions)} label="Contributions" sub={`${s.goals}G + ${s.assists}A`} color="#4ECDC4" />
            </View>
            <View style={[styles.statsList, { borderColor: colors.border }]}>
              <StatRow label="Goals" value={String(s.goals)} color={sc} highlight />
              <StatRow label="Assists" value={String(s.assists)} />
              <StatRow label="Appearances" value={String(s.appearances)} />
            </View>
          </View>
        );
      })()}

      {currentUser.sport === "basketball" && stats?.basketball && (() => {
        const s = stats.basketball;
        const ppg = s.games > 0 ? s.points / s.games : 0;
        const rpg = s.games > 0 ? s.rebounds / s.games : 0;
        const apg = s.games > 0 ? s.assists / s.games : 0;
        return (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Basketball</Text>
            <View style={styles.bigStatsRow}>
              <BigStat value={fmt(ppg)} label="PPG" sub={`${s.points} pts in ${s.games} games`} color={sc} />
              <View style={[styles.bigStatDivider, { backgroundColor: colors.border }]} />
              <BigStat value={fmt(rpg)} label="RPG" sub={`${s.rebounds} total`} color="#A855F7" />
            </View>
            <View style={[styles.statsList, { borderColor: colors.border }]}>
              <StatRow label="Assists / Game" value={fmt(apg)} color={sc} highlight />
              <StatRow label="Total Points" value={String(s.points)} />
              <StatRow label="Total Rebounds" value={String(s.rebounds)} />
              <StatRow label="Games Played" value={String(s.games)} />
            </View>
          </View>
        );
      })()}

      {myMatches.length > 0 && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Recent Results</Text>
          <View style={styles.matchList}>
            {myMatches.slice(0, 4).map((m) => {
              const resultColor = m.result === "win" ? "#00C896" : m.result === "loss" ? "#EF4444" : colors.accent;
              const resultLabel = m.result === "win" ? "W" : m.result === "loss" ? "L" : "D";
              return (
                <View key={m.id} style={[styles.matchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.resultPill, { backgroundColor: resultColor + "22" }]}>
                    <Text style={[styles.resultLetter, { color: resultColor }]}>{resultLabel}</Text>
                  </View>
                  <View style={styles.matchInfo}>
                    <Text style={[styles.matchOpponent, { color: colors.foreground }]}>vs {m.opponent}</Text>
                    <Text style={[styles.matchDate, { color: colors.mutedForeground }]}>
                      {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  {m.score && (
                    <Text style={[styles.matchScore, { color: colors.foreground }]}>
                      {m.score.home}–{m.score.away}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.actionsSection}>
        <Pressable
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/map")}
        >
          <Ionicons name="map-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Map View</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/teams")}
        >
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Browse Teams</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.actionText, { color: colors.destructive }]}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  noUser: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
  hero: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 24,
    gap: 10,
    borderBottomWidth: 1,
  },
  avatarRing: { padding: 3, borderRadius: 46, borderWidth: 2 },
  avatar: { width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 30, fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  chips: { flexDirection: "row", gap: 8 },
  teamBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1,
  },
  teamDot: { width: 8, height: 8, borderRadius: 4 },
  teamBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  noTeamBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  noTeamText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  section: { paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, gap: 14 },
  sectionTitle: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase", letterSpacing: 1,
  },

  formRow: { flexDirection: "row", gap: 8 },
  formDot: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  formLabel: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  formSub: { fontSize: 12, fontFamily: "Inter_400Regular" },

  overviewRow: { flexDirection: "row", gap: 10 },
  overviewCard: {
    flex: 1, alignItems: "center", paddingVertical: 16,
    borderRadius: 14, borderWidth: 1, gap: 4,
  },
  overviewVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  overviewLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },

  bigStatsRow: { flexDirection: "row", alignItems: "center" },
  bigStatWrap: { flex: 1, alignItems: "center", gap: 4 },
  bigStatValue: { fontSize: 38, fontFamily: "Inter_700Bold" },
  bigStatLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bigStatSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bigStatDivider: { width: 1, height: 60 },

  statsList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  statRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 13,
  },
  statRowLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  statRowValue: { fontSize: 15, fontFamily: "Inter_700Bold" },

  matchList: { gap: 8 },
  matchRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 12, borderRadius: 12, borderWidth: 1,
  },
  resultPill: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  resultLetter: { fontSize: 13, fontFamily: "Inter_700Bold" },
  matchInfo: { flex: 1 },
  matchOpponent: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  matchDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  matchScore: { fontSize: 14, fontFamily: "Inter_700Bold" },

  actionsSection: { padding: 20, gap: 10 },
  actionRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 16, borderRadius: 14, borderWidth: 1,
  },
  actionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
