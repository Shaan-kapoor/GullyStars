import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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

import { PrimaryButton } from "@/components/PrimaryButton";
import { RoleChip } from "@/components/RoleChip";
import { SportBadge, sportColor } from "@/components/SportBadge";
import { StatCard } from "@/components/StatCard";
import { Sport, TrainingSession, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatDate(date: string, time?: string) {
  const d = new Date(date + (time ? "T" + time : ""));
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + (time ? " · " + time : "");
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { teams, currentUser, trainingSessions, matches, createTrainingSession, createMatch, respondToTraining, respondToMatch, submitScore, followTeam, unfollowTeam, followedTeams, joinTeam } = useApp();

  const team = teams.find((t) => t.id === id);
  const sc = team ? sportColor(team.sport) : colors.primary;
  const isMember = team?.members.some((m) => m.id === currentUser?.id);
  const isCaptain = team?.captainId === currentUser?.id;
  const isFollowing = followedTeams.includes(id ?? "");

  const [tab, setTab] = useState<"squad" | "training" | "matches">("squad");
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState<string | null>(null);

  const [tsTitle, setTsTitle] = useState("");
  const [tsDate, setTsDate] = useState("");
  const [tsTime, setTsTime] = useState("");
  const [tsLocation, setTsLocation] = useState("");

  const [mOpponent, setMOpponent] = useState("");
  const [mDate, setMDate] = useState("");
  const [mTime, setMTime] = useState("");
  const [mLocation, setMLocation] = useState("");

  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!team) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Team not found.</Text>
      </View>
    );
  }

  const teamTraining = trainingSessions.filter((s) => s.teamId === team.id);
  const teamMatches = matches.filter((m) => m.teamId === team.id);

  const handleCreateTraining = () => {
    if (!tsTitle || !tsDate || !tsTime || !tsLocation || !currentUser) return;
    createTrainingSession({ teamId: team.id, title: tsTitle, date: tsDate, time: tsTime, location: tsLocation, createdBy: currentUser.id });
    setShowTrainingModal(false);
    setTsTitle(""); setTsDate(""); setTsTime(""); setTsLocation("");
  };

  const handleCreateMatch = () => {
    if (!mOpponent || !mDate || !mTime || !mLocation || !currentUser) return;
    createMatch({ teamId: team.id, opponent: mOpponent, date: mDate, time: mTime, location: mLocation, sport: team.sport });
    setShowMatchModal(false);
    setMOpponent(""); setMDate(""); setMTime(""); setMLocation("");
  };

  const handleSubmitScore = (matchId: string) => {
    const h = parseInt(scoreHome);
    const a = parseInt(scoreAway);
    if (isNaN(h) || isNaN(a)) return;
    submitScore(matchId, { home: h, away: a });
    setShowScoreModal(null);
    setScoreHome(""); setScoreAway("");
  };

  const rsvpColor = (r: "going" | "not_going" | "maybe" | undefined) => {
    if (r === "going") return colors.primary;
    if (r === "not_going") return colors.destructive;
    if (r === "maybe") return colors.accent;
    return colors.mutedForeground;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 30 }}>
        <View style={[styles.hero, { backgroundColor: sc + "18", paddingTop: topPad + 10 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.heroAvatar, { backgroundColor: sc + "33" }]}>
            <Text style={[styles.heroInitial, { color: sc }]}>{team.name[0]}</Text>
          </View>
          <Text style={[styles.heroName, { color: colors.foreground }]}>{team.name}</Text>
          <View style={styles.heroMeta}>
            <SportBadge sport={team.sport} size="md" />
            <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
              {team.members.length} members
            </Text>
          </View>
          <Text style={[styles.heroDec, { color: colors.mutedForeground }]}>{team.description}</Text>

          <View style={styles.heroActions}>
            {!isMember && (
              <PrimaryButton
                label={team.isPublic ? "Join Team" : "Request to Join"}
                onPress={() => {
                  if (team.isPublic) joinTeam(team.id);
                  else {}
                }}
              />
            )}
            <Pressable
              style={[styles.followBtn, { borderColor: isFollowing ? sc : colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                isFollowing ? unfollowTeam(team.id) : followTeam(team.id);
              }}
            >
              <Ionicons name={isFollowing ? "heart" : "heart-outline"} size={18} color={isFollowing ? sc : colors.mutedForeground} />
              <Text style={[styles.followText, { color: isFollowing ? sc : colors.mutedForeground }]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(["squad", "training", "matches"] as const).map((t) => (
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

        {tab === "squad" && (
          <View style={styles.section}>
            {team.members.map((member) => (
              <View key={member.id} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.memberAvatar, { backgroundColor: sc + "22" }]}>
                  <Text style={[styles.memberInitial, { color: sc }]}>{member.name[0]}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>{member.name}</Text>
                  <Text style={[styles.memberJoined, { color: colors.mutedForeground }]}>
                    Joined {new Date(member.joinedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </Text>
                </View>
                <RoleChip role={member.role} />
              </View>
            ))}
          </View>
        )}

        {tab === "training" && (
          <View style={styles.section}>
            {isCaptain && (
              <Pressable
                style={[styles.addCard, { borderColor: colors.border }]}
                onPress={() => setShowTrainingModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.addCardText, { color: colors.primary }]}>New Training Session</Text>
              </Pressable>
            )}
            {teamTraining.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No training sessions yet</Text>
            )}
            {teamTraining.map((s) => {
              const myRsvp = currentUser ? s.responses[currentUser.id] : undefined;
              const goingCount = Object.values(s.responses).filter((r) => r === "going").length;
              return (
                <View key={s.id} style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.sessionAccent, { backgroundColor: sc }]} />
                  <View style={styles.sessionBody}>
                    <Text style={[styles.sessionTitle, { color: colors.foreground }]}>{s.title}</Text>
                    <View style={styles.sessionMeta}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.sessionMetaText, { color: colors.mutedForeground }]}>
                        {formatDate(s.date, s.time)}
                      </Text>
                    </View>
                    <View style={styles.sessionMeta}>
                      <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.sessionMetaText, { color: colors.mutedForeground }]}>{s.location}</Text>
                    </View>
                    <Text style={[styles.goingCount, { color: colors.primary }]}>{goingCount} going</Text>
                    {isMember && (
                      <View style={styles.rsvpRow}>
                        {(["going", "maybe", "not_going"] as const).map((r) => (
                          <Pressable
                            key={r}
                            style={[
                              styles.rsvpBtn,
                              {
                                backgroundColor: myRsvp === r ? rsvpColor(r) + "22" : colors.secondary,
                                borderColor: myRsvp === r ? rsvpColor(r) : "transparent",
                              },
                            ]}
                            onPress={() => {
                              if (Platform.OS !== "web") Haptics.selectionAsync();
                              respondToTraining(s.id, r);
                            }}
                          >
                            <Text style={[styles.rsvpText, { color: myRsvp === r ? rsvpColor(r) : colors.mutedForeground }]}>
                              {r === "not_going" ? "No" : r === "going" ? "Going" : "Maybe"}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {tab === "matches" && (
          <View style={styles.section}>
            {isCaptain && (
              <Pressable
                style={[styles.addCard, { borderColor: colors.border }]}
                onPress={() => setShowMatchModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.addCardText, { color: colors.primary }]}>Schedule Match</Text>
              </Pressable>
            )}
            {teamMatches.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No matches scheduled</Text>
            )}
            {teamMatches.map((m) => {
              const myRsvp = currentUser ? m.rsvps[currentUser.id] : undefined;
              const goingCount = Object.values(m.rsvps).filter((r) => r === "going").length;
              return (
                <View key={m.id} style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.matchHeader}>
                    <Text style={[styles.matchVs, { color: colors.foreground }]}>vs {m.opponent}</Text>
                    <View style={[styles.statusPill, { backgroundColor: m.status === "completed" ? "#64748B22" : m.status === "live" ? "#EF444422" : colors.primary + "22" }]}>
                      <Text style={[styles.statusText, { color: m.status === "completed" ? "#64748B" : m.status === "live" ? "#EF4444" : colors.primary }]}>
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.matchMeta}>
                    <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.sessionMetaText, { color: colors.mutedForeground }]}>{formatDate(m.date, m.time)}</Text>
                  </View>
                  <View style={styles.matchMeta}>
                    <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.sessionMetaText, { color: colors.mutedForeground }]}>{m.location}</Text>
                  </View>
                  {m.score && (
                    <View style={[styles.scoreBanner, { backgroundColor: m.result === "win" ? colors.primary + "18" : m.result === "loss" ? colors.destructive + "18" : colors.secondary }]}>
                      <Text style={[styles.scoreText, { color: m.result === "win" ? colors.primary : m.result === "loss" ? colors.destructive : colors.foreground }]}>
                        {m.score.home} — {m.score.away} · {m.result?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {isMember && m.status === "upcoming" && (
                    <View style={styles.rsvpRow}>
                      {(["going", "maybe", "not_going"] as const).map((r) => (
                        <Pressable
                          key={r}
                          style={[
                            styles.rsvpBtn,
                            {
                              backgroundColor: myRsvp === r ? rsvpColor(r) + "22" : colors.secondary,
                              borderColor: myRsvp === r ? rsvpColor(r) : "transparent",
                            },
                          ]}
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.selectionAsync();
                            respondToMatch(m.id, r);
                          }}
                        >
                          <Text style={[styles.rsvpText, { color: myRsvp === r ? rsvpColor(r) : colors.mutedForeground }]}>
                            {r === "not_going" ? "No" : r === "going" ? "Going" : "Maybe"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Text style={[styles.goingCount, { color: colors.mutedForeground }]}>{goingCount} confirmed</Text>
                  {isCaptain && m.status === "upcoming" && (
                    <Pressable
                      style={[styles.scoreBtn, { backgroundColor: colors.accent }]}
                      onPress={() => setShowScoreModal(m.id)}
                    >
                      <Text style={[styles.scoreBtnText, { color: colors.accentForeground }]}>Submit Score</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={showTrainingModal} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Training Session</Text>
            <Pressable onPress={() => setShowTrainingModal(false)}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {[
              { label: "Title", value: tsTitle, set: setTsTitle, placeholder: "e.g. Pre-match warmup" },
              { label: "Date (YYYY-MM-DD)", value: tsDate, set: setTsDate, placeholder: "2026-04-20" },
              { label: "Time (HH:MM)", value: tsTime, set: setTsTime, placeholder: "06:30" },
              { label: "Location", value: tsLocation, set: setTsLocation, placeholder: "Rec Ground, Gate 3" },
            ].map((f) => (
              <View key={f.label} style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            ))}
            <View style={{ paddingBottom: 40 }}>
              <PrimaryButton label="Create Session" onPress={handleCreateTraining} disabled={!tsTitle || !tsDate} fullWidth />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showMatchModal} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Schedule Match</Text>
            <Pressable onPress={() => setShowMatchModal(false)}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {[
              { label: "Opponent", value: mOpponent, set: setMOpponent, placeholder: "e.g. Red Devils" },
              { label: "Date (YYYY-MM-DD)", value: mDate, set: setMDate, placeholder: "2026-04-25" },
              { label: "Time (HH:MM)", value: mTime, set: setMTime, placeholder: "10:00" },
              { label: "Location", value: mLocation, set: setMLocation, placeholder: "Community Grounds, Pitch B" },
            ].map((f) => (
              <View key={f.label} style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            ))}
            <View style={{ paddingBottom: 40 }}>
              <PrimaryButton label="Schedule Match" onPress={handleCreateMatch} disabled={!mOpponent || !mDate} fullWidth />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!showScoreModal} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Submit Result</Text>
            <Pressable onPress={() => setShowScoreModal(null)}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={[styles.modalContent, styles.scoreForm]}>
            <View style={styles.scoreInputRow}>
              <View style={styles.scoreInputWrap}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>{team.name}</Text>
                <TextInput
                  style={[styles.scoreInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={scoreHome}
                  onChangeText={setScoreHome}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <Text style={[styles.scoreDash, { color: colors.mutedForeground }]}>—</Text>
              <View style={styles.scoreInputWrap}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Opponent</Text>
                <TextInput
                  style={[styles.scoreInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={scoreAway}
                  onChangeText={setScoreAway}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
            <PrimaryButton
              label="Submit Result"
              onPress={() => showScoreModal && handleSubmitScore(showScoreModal)}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { textAlign: "center", padding: 40, fontFamily: "Inter_400Regular" },
  hero: { padding: 20, paddingBottom: 24, alignItems: "center", gap: 10 },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  heroAvatar: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  heroInitial: { fontSize: 28, fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroDec: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  memberCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  heroActions: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 4 },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  followText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { padding: 16, gap: 10 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  memberAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  memberInitial: { fontSize: 16, fontFamily: "Inter_700Bold" },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  memberJoined: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addCardText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyText: { textAlign: "center", padding: 20, fontFamily: "Inter_400Regular", fontSize: 14 },
  sessionCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  sessionAccent: { width: 4 },
  sessionBody: { flex: 1, padding: 14, gap: 6 },
  sessionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sessionMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  sessionMetaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  goingCount: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  rsvpRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  rsvpBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 100, borderWidth: 1.5 },
  rsvpText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  matchCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  matchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  matchVs: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  matchMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  scoreBanner: { padding: 10, borderRadius: 10, alignItems: "center" },
  scoreText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scoreBtn: { padding: 12, borderRadius: 100, alignItems: "center", marginTop: 4 },
  scoreBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 24, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalContent: { padding: 20 },
  formGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  scoreForm: { gap: 24, alignItems: "center" },
  scoreInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 16 },
  scoreInputWrap: { alignItems: "center", gap: 8 },
  scoreInput: { width: 90, height: 80, borderRadius: 14, borderWidth: 1, textAlign: "center", fontSize: 32, fontFamily: "Inter_700Bold" },
  scoreDash: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 16 },
});
