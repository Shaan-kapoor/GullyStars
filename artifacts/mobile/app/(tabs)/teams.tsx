import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SportBadge, sportColor } from "@/components/SportBadge";
import { Sport, Team, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function TeamCard({ team, index }: { team: Team; index: number }) {
  const colors = useColors();
  const { currentUser, joinTeam, requestJoinTeam, followedTeams, followTeam } = useApp();
  const sc = sportColor(team.sport);
  const isMember = team.members.some((m) => m.id === currentUser?.id);
  const isFollowing = followedTeams.includes(team.id);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(280)}>
      <Pressable
        style={[styles.teamCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: "/team/[id]", params: { id: team.id } })}
      >
        <View style={[styles.teamIcon, { backgroundColor: sc + "22" }]}>
          <Text style={[styles.teamInitial, { color: sc }]}>{team.name[0]}</Text>
        </View>
        <View style={styles.teamInfo}>
          <View style={styles.teamNameRow}>
            <Text style={[styles.teamName, { color: colors.foreground }]}>{team.name}</Text>
            {!team.isPublic && (
              <Ionicons name="lock-closed" size={12} color={colors.mutedForeground} />
            )}
          </View>
          <Text style={[styles.teamDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
            {team.description}
          </Text>
          <View style={styles.teamMeta}>
            <SportBadge sport={team.sport} size="sm" />
            <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
              {team.members.length} members
            </Text>
          </View>
        </View>
        {!isMember && (
          <Pressable
            style={[styles.joinBtn, { backgroundColor: team.isPublic ? colors.primary : colors.secondary }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (team.isPublic) joinTeam(team.id);
              else requestJoinTeam(team.id);
            }}
          >
            <Text style={[styles.joinText, { color: team.isPublic ? colors.primaryForeground : colors.mutedForeground }]}>
              {team.isPublic ? "Join" : "Request"}
            </Text>
          </Pressable>
        )}
        {isMember && (
          <View style={[styles.memberBadge, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.memberText, { color: colors.primary }]}>Member</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const SPORT_FILTERS: Array<{ sport: Sport | "all"; label: string }> = [
  { sport: "all", label: "All" },
  { sport: "football", label: "Football" },
  { sport: "cricket", label: "Cricket" },
  { sport: "basketball", label: "Basketball" },
];

export default function TeamsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { teams, currentUser, createTeam } = useApp();

  const [filter, setFilter] = useState<Sport | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [sport, setSport] = useState<Sport>("football");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = teams.filter((t) => filter === "all" || t.sport === filter);

  const handleCreate = async () => {
    if (!name.trim() || !currentUser || creating) return;
    setCreating(true);
    try {
      const team = await createTeam({
        name: name.trim(),
        description: desc.trim(),
        sport,
        captainId: currentUser.id,
        isPublic,
      });
      setShowCreate(false);
      setName("");
      setDesc("");
      router.push({ pathname: "/team/[id]", params: { id: team.id } });
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Teams</Text>
          {(currentUser?.role === "captain" || currentUser?.role === "organiser") && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreate(true)}
            >
              <Ionicons name="add" size={20} color={colors.primaryForeground} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {SPORT_FILTERS.map((f) => (
            <Pressable
              key={f.sport}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.sport ? colors.primary : colors.secondary,
                  marginRight: 8,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setFilter(f.sport);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.sport ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => <TeamCard team={item} index={index} />}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="people-outline" title="No teams found" subtitle="Create a team or check another sport filter" />
        }
        scrollEnabled
      />

      <Modal visible={showCreate} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create Team</Text>
            <Pressable onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Team Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Street Lions FC"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={desc}
                onChangeText={setDesc}
                placeholder="What's your team about?"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Sport</Text>
              <View style={styles.sportRow}>
                {(["football", "cricket", "basketball"] as Sport[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.sportChip,
                      {
                        backgroundColor: sport === s ? sportColor(s) + "22" : colors.secondary,
                        borderColor: sport === s ? sportColor(s) : colors.border,
                      },
                    ]}
                    onPress={() => setSport(s)}
                  >
                    <Text style={[styles.sportChipText, { color: sport === s ? sportColor(s) : colors.mutedForeground }]}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.formGroup, styles.switchRow]}>
              <View>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Public Team</Text>
                <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                  Anyone can join without approval
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.secondary, true: colors.primary }}
              />
            </View>
            <View style={{ paddingTop: 8, paddingBottom: 40 }}>
              <PrimaryButton
                label="Create Team"
                onPress={handleCreate}
                loading={creating}
                disabled={!name.trim()}
                fullWidth
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { padding: 16, gap: 0 },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  teamIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  teamInitial: { fontSize: 20, fontFamily: "Inter_700Bold" },
  teamInfo: { flex: 1, gap: 4 },
  teamNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  teamName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  teamDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  teamMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100 },
  joinText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  memberBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  memberText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalContent: { padding: 20 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { height: 80, textAlignVertical: "top" },
  sportRow: { flexDirection: "row", gap: 8 },
  sportChip: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  sportChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
