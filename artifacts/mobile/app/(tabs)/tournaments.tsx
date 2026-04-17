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
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SportBadge, sportColor } from "@/components/SportBadge";
import { Sport, Tournament, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS: Record<string, string> = {
  registration: "#FFB800",
  ongoing: "#00C896",
  completed: "#64748B",
};

function TournamentCard({ tournament, index }: { tournament: Tournament; index: number }) {
  const colors = useColors();
  const sc = sportColor(tournament.sport);
  const statusColor = STATUS_COLORS[tournament.status];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(280)}>
      <Pressable
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: tournament.id } })}
      >
        <View style={[styles.cardAccent, { backgroundColor: sc }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardName, { color: colors.foreground }]}>{tournament.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <SportBadge sport={tournament.sport} size="md" />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {tournament.format === "round-robin" ? "Round Robin" : "Bracket"}
            </Text>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {tournament.teams.length} teams
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={[styles.fixtureCount, { color: colors.mutedForeground }]}>
              {tournament.fixtures.length} fixtures
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function TournamentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tournaments, currentUser, createTournament } = useApp();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<Sport>("football");
  const [format, setFormat] = useState<"round-robin" | "bracket">("round-robin");
  const [creating, setCreating] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCreate = async () => {
    if (!name.trim() || !currentUser || creating) return;
    setCreating(true);
    try {
      await createTournament({
        name: name.trim(),
        sport,
        organiserId: currentUser.id,
        format,
        status: "registration",
      });
      setShowCreate(false);
      setName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Tournaments</Text>
          {currentUser?.role === "organiser" && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreate(true)}
            >
              <Ionicons name="add" size={20} color={colors.primaryForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={tournaments}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => <TournamentCard tournament={item} index={index} />}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="trophy-outline" title="No tournaments yet" subtitle="Organisers can create tournaments for teams to compete" />
        }
        scrollEnabled
      />

      <Modal visible={showCreate} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Tournament</Text>
            <Pressable onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Tournament Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Gully Cup 2026"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Sport</Text>
              <View style={styles.optRow}>
                {(["football", "cricket", "basketball"] as Sport[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.optChip,
                      {
                        backgroundColor: sport === s ? sportColor(s) + "22" : colors.secondary,
                        borderColor: sport === s ? sportColor(s) : colors.border,
                      },
                    ]}
                    onPress={() => setSport(s)}
                  >
                    <Text style={[styles.optText, { color: sport === s ? sportColor(s) : colors.mutedForeground }]}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Format</Text>
              <View style={styles.optRow}>
                {(["round-robin", "bracket"] as const).map((f) => (
                  <Pressable
                    key={f}
                    style={[
                      styles.optChip,
                      {
                        backgroundColor: format === f ? colors.primary + "22" : colors.secondary,
                        borderColor: format === f ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setFormat(f)}
                  >
                    <Text style={[styles.optText, { color: format === f ? colors.primary : colors.mutedForeground }]}>
                      {f === "round-robin" ? "Round Robin" : "Bracket"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ paddingTop: 8, paddingBottom: 40 }}>
              <PrimaryButton
                label="Create Tournament"
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
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, gap: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardName: { fontSize: 16, fontFamily: "Inter_700Bold", flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fixtureCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

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
  optRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  optChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  optText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
