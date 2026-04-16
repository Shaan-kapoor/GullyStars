import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoleChip } from "@/components/RoleChip";
import { SportBadge, sportColor } from "@/components/SportBadge";
import { StatCard } from "@/components/StatCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, teams, matches, trainingSessions, setCurrentUser } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentUser) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad + 40 }]}>
        <Text style={[styles.noUser, { color: colors.mutedForeground }]}>
          Complete onboarding to see your profile.
        </Text>
      </View>
    );
  }

  const myTeam = teams.find((t) => t.members.some((m) => m.id === currentUser.id));
  const myMember = myTeam?.members.find((m) => m.id === currentUser.id);
  const sc = sportColor(currentUser.sport);

  const myMatches = matches.filter((m) => m.teamId === myTeam?.id);
  const myTraining = trainingSessions.filter((s) => s.teamId === myTeam?.id);
  const wins = myMatches.filter((m) => m.result === "win").length;
  const going = myTraining.filter((s) => s.responses[currentUser.id] === "going").length;

  const stats = myMember?.stats;

  const handleSignOut = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    AsyncStorage.removeItem("gully_stars_state");
    setCurrentUser(null);
    router.replace("/onboarding");
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroSection, { paddingTop: topPad + 20, backgroundColor: colors.card }]}>
        <View style={[styles.avatarRing, { borderColor: sc }]}>
          <View style={[styles.avatar, { backgroundColor: sc + "33" }]}>
            <Text style={[styles.avatarText, { color: sc }]}>{currentUser.name[0]}</Text>
          </View>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{currentUser.name}</Text>
        <View style={styles.chips}>
          <RoleChip role={currentUser.role} />
          <SportBadge sport={currentUser.sport} size="md" />
        </View>
        {myTeam && (
          <Pressable
            style={[styles.teamBadge, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/team/[id]", params: { id: myTeam.id } })}
          >
            <View style={[styles.teamDot, { backgroundColor: sc }]} />
            <Text style={[styles.teamBadgeText, { color: colors.foreground }]}>{myTeam.name}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Performance</Text>
        <View style={styles.statsRow}>
          <StatCard label="Matches" value={stats?.matches ?? 0} />
          <StatCard label="Wins" value={wins} color="#00C896" />
          <StatCard label="Training" value={going} color="#FFB800" />
        </View>
      </View>

      {currentUser.sport === "cricket" && stats?.cricket && (
        <View style={styles.statsSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Cricket Stats</Text>
          <View style={styles.statsRow}>
            <StatCard label="Runs" value={stats.cricket.runs} color="#FF6B35" />
            <StatCard label="Wickets" value={stats.cricket.wickets} color="#FF6B35" />
            <StatCard label="Catches" value={stats.cricket.catches} color="#FF6B35" />
          </View>
        </View>
      )}
      {currentUser.sport === "football" && stats?.football && (
        <View style={styles.statsSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Football Stats</Text>
          <View style={styles.statsRow}>
            <StatCard label="Goals" value={stats.football.goals} color="#4ECDC4" />
            <StatCard label="Assists" value={stats.football.assists} color="#4ECDC4" />
            <StatCard label="Clean Sheets" value={stats.football.cleanSheets} color="#4ECDC4" />
          </View>
        </View>
      )}
      {currentUser.sport === "basketball" && stats?.basketball && (
        <View style={styles.statsSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Basketball Stats</Text>
          <View style={styles.statsRow}>
            <StatCard label="Points" value={stats.basketball.points} color="#FFE66D" />
            <StatCard label="Rebounds" value={stats.basketball.rebounds} color="#FFE66D" />
            <StatCard label="Assists" value={stats.basketball.assists} color="#FFE66D" />
          </View>
        </View>
      )}

      <View style={styles.actionsSection}>
        <Pressable
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/teams")}
        >
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Browse Teams</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/tournaments")}
        >
          <Ionicons name="trophy-outline" size={20} color={colors.accent} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Tournaments</Text>
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
  noUser: { textAlign: "center", fontSize: 15, paddingHorizontal: 40, fontFamily: "Inter_400Regular" },
  heroSection: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 28,
    gap: 12,
  },
  avatarRing: { padding: 3, borderRadius: 44, borderWidth: 2 },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 30, fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  chips: { flexDirection: "row", gap: 8, alignItems: "center" },
  teamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  teamDot: { width: 8, height: 8, borderRadius: 4 },
  teamBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsSection: { padding: 20, paddingBottom: 0 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 10 },
  actionsSection: { padding: 20, gap: 10, paddingTop: 24 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
