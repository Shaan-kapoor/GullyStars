import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SportBadge, sportColor } from "@/components/SportBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tournaments, teams, currentUser, applyToTournament } = useApp();

  const tournament = tournaments.find((t) => t.id === id);
  const sc = tournament ? sportColor(tournament.sport) : colors.primary;

  const [tab, setTab] = useState<"fixtures" | "standings">("standings");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!tournament) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Tournament not found.</Text>
      </View>
    );
  }

  const myTeam = teams.find((t) => t.members.some((m) => m.id === currentUser?.id));
  const canApply = myTeam && !tournament.teams.includes(myTeam.id) && tournament.status === "registration";

  const rounds = [...new Set(tournament.fixtures.map((f) => f.round))].sort();

  const statusColor: Record<string, string> = {
    registration: "#FFB800",
    ongoing: "#00C896",
    completed: "#64748B",
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 30 }}>
        <View style={[styles.hero, { backgroundColor: sc + "18", paddingTop: topPad + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.trophyWrap, { backgroundColor: sc + "33" }]}>
            <Ionicons name="trophy" size={36} color={sc} />
          </View>
          <Text style={[styles.heroName, { color: colors.foreground }]}>{tournament.name}</Text>
          <View style={styles.heroMeta}>
            <SportBadge sport={tournament.sport} size="md" />
            <View style={[styles.statusBadge, { backgroundColor: statusColor[tournament.status] + "22" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor[tournament.status] }]} />
              <Text style={[styles.statusText, { color: statusColor[tournament.status] }]}>
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: sc }]}>{tournament.teams.length}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Teams</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: sc }]}>{tournament.fixtures.length}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Fixtures</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: sc }]}>{tournament.format === "round-robin" ? "RR" : "KO"}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Format</Text>
            </View>
          </View>
          {canApply && (
            <Pressable
              style={[styles.applyBtn, { backgroundColor: sc }]}
              onPress={() => applyToTournament(tournament.id, myTeam.id)}
            >
              <Text style={[styles.applyText, { color: colors.primaryForeground }]}>Apply with {myTeam.name}</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(["standings", "fixtures"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tabBtn, tab === t && { borderBottomColor: sc, borderBottomWidth: 2 }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? sc : colors.mutedForeground }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "standings" && (
          <View style={styles.section}>
            {tournament.standings.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Standings update once matches are played</Text>
            ) : (
              <View style={[styles.table, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.thPos, { color: colors.mutedForeground }]}>#</Text>
                  <Text style={[styles.thTeam, { color: colors.mutedForeground }]}>Team</Text>
                  <Text style={[styles.thNum, { color: colors.mutedForeground }]}>P</Text>
                  <Text style={[styles.thNum, { color: colors.mutedForeground }]}>W</Text>
                  <Text style={[styles.thNum, { color: colors.mutedForeground }]}>D</Text>
                  <Text style={[styles.thNum, { color: colors.mutedForeground }]}>L</Text>
                  <Text style={[styles.thNum, { color: sc }]}>Pts</Text>
                </View>
                {[...tournament.standings]
                  .sort((a, b) => b.points - a.points)
                  .map((s, i) => (
                    <View
                      key={s.teamId}
                      style={[
                        styles.tableRow,
                        i < tournament.standings.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                        i === 0 && { backgroundColor: sc + "0A" },
                      ]}
                    >
                      <Text style={[styles.tdPos, { color: i === 0 ? sc : colors.mutedForeground }]}>{i + 1}</Text>
                      <Text style={[styles.tdTeam, { color: colors.foreground }]} numberOfLines={1}>{s.teamName}</Text>
                      <Text style={[styles.tdNum, { color: colors.foreground }]}>{s.played}</Text>
                      <Text style={[styles.tdNum, { color: colors.primary }]}>{s.won}</Text>
                      <Text style={[styles.tdNum, { color: colors.accent }]}>{s.drawn}</Text>
                      <Text style={[styles.tdNum, { color: colors.destructive }]}>{s.lost}</Text>
                      <Text style={[styles.tdNum, { color: sc, fontFamily: "Inter_700Bold" }]}>{s.points}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {tab === "fixtures" && (
          <View style={styles.section}>
            {tournament.fixtures.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No fixtures scheduled yet</Text>
            ) : (
              rounds.map((round) => (
                <View key={round}>
                  <Text style={[styles.roundLabel, { color: colors.mutedForeground }]}>Round {round}</Text>
                  {tournament.fixtures
                    .filter((f) => f.round === round)
                    .map((fixture) => (
                      <View key={fixture.id} style={[styles.fixture, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.fixtureTeams}>
                          <Text style={[styles.fixtureName, { color: colors.foreground }]} numberOfLines={1}>{fixture.homeTeamName}</Text>
                          {fixture.score ? (
                            <View style={[styles.scoreBox, { backgroundColor: colors.secondary }]}>
                              <Text style={[styles.scoreVal, { color: colors.foreground }]}>
                                {fixture.score.home} — {fixture.score.away}
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.vsBox, { backgroundColor: colors.secondary }]}>
                              <Text style={[styles.vsText, { color: colors.mutedForeground }]}>vs</Text>
                            </View>
                          )}
                          <Text style={[styles.fixtureName, { color: colors.foreground, textAlign: "right" }]} numberOfLines={1}>{fixture.awayTeamName}</Text>
                        </View>
                        <Text style={[styles.fixtureDate, { color: colors.mutedForeground }]}>{formatDate(fixture.date)}</Text>
                      </View>
                    ))}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { textAlign: "center", padding: 40, fontFamily: "Inter_400Regular" },
  hero: { padding: 20, paddingBottom: 24, alignItems: "center", gap: 12 },
  backBtn: { alignSelf: "flex-start", marginBottom: 4 },
  trophyWrap: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  heroName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  heroStats: { flexDirection: "row", alignItems: "center", gap: 0 },
  heroStat: { flex: 1, alignItems: "center", gap: 3 },
  heroStatVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroStatLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32 },
  applyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, marginTop: 4 },
  applyText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { padding: 16, gap: 10 },
  emptyText: { textAlign: "center", padding: 20, fontFamily: "Inter_400Regular", fontSize: 14 },
  table: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  thPos: { width: 24, fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },
  thTeam: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },
  thNum: { width: 28, textAlign: "center", fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tdPos: { width: 24, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tdTeam: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  tdNum: { width: 28, textAlign: "center", fontSize: 14, fontFamily: "Inter_500Medium" },
  roundLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  fixture: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 8 },
  fixtureTeams: { flexDirection: "row", alignItems: "center", gap: 8 },
  fixtureName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scoreBox: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  scoreVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  vsBox: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  vsText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fixtureDate: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});
