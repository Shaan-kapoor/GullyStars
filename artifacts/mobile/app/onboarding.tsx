import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Sport, User, UserRole, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const ROLES: { role: UserRole; label: string; desc: string; icon: string }[] = [
  { role: "player", label: "Player", desc: "Join a team, track your stats", icon: "person" },
  { role: "captain", label: "Captain", desc: "Manage your squad & matches", icon: "shield" },
  { role: "organiser", label: "Organiser", desc: "Run tournaments & leagues", icon: "trophy" },
  { role: "fan", label: "Fan", desc: "Follow teams, cheer them on", icon: "heart" },
];

const SPORTS: { sport: Sport; label: string; icon: string; color: string }[] = [
  { sport: "cricket", label: "Cricket", icon: "cricket", color: "#FF6B35" },
  { sport: "football", label: "Football", icon: "soccer", color: "#4ECDC4" },
  { sport: "basketball", label: "Basketball", icon: "basketball", color: "#FFE66D" },
];

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [sport, setSport] = useState<Sport | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const canNext =
    step === 0 ? name.trim().length > 1 : step === 1 ? role !== null : sport !== null;

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 2) {
      setStep(step + 1);
    } else {
      const user: User = {
        id: generateId(),
        name: name.trim(),
        role: role!,
        sport: sport!,
      };
      completeOnboarding(user);
      router.replace("/(tabs)/");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: colors.primary + "22" }]}>
            <MaterialCommunityIcons name="star-four-points" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.logoText, { color: colors.foreground }]}>Gully Stars</Text>
        </View>

        <View style={styles.stepDots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? colors.primary : colors.secondary },
                i === step && { width: 24 },
              ]}
            />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={[styles.heading, { color: colors.foreground }]}>What's your name?</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Your teammates will see this on the app
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={canNext ? handleNext : undefined}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.heading, { color: colors.foreground }]}>Your role?</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Choose how you use Gully Stars
            </Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.role}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setRole(r.role);
                  }}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: role === r.role ? colors.primary + "18" : colors.card,
                      borderColor: role === r.role ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={r.icon as any}
                    size={28}
                    color={role === r.role ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[styles.roleLabel, { color: role === r.role ? colors.primary : colors.foreground }]}>
                    {r.label}
                  </Text>
                  <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.heading, { color: colors.foreground }]}>Your sport?</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We'll personalise your feed around this
            </Text>
            <View style={styles.sportList}>
              {SPORTS.map((s) => (
                <Pressable
                  key={s.sport}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setSport(s.sport);
                  }}
                  style={[
                    styles.sportRow,
                    {
                      backgroundColor: sport === s.sport ? s.color + "18" : colors.card,
                      borderColor: sport === s.sport ? s.color : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={s.icon as any}
                    size={28}
                    color={sport === s.sport ? s.color : colors.mutedForeground}
                  />
                  <Text style={[styles.sportLabel, { color: sport === s.sport ? s.color : colors.foreground }]}>
                    {s.label}
                  </Text>
                  {sport === s.sport && (
                    <Ionicons name="checkmark-circle" size={22} color={s.color} style={styles.check} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable
          onPress={canNext ? handleNext : undefined}
          style={({ pressed }) => [
            styles.nextBtn,
            {
              backgroundColor: canNext ? colors.primary : colors.secondary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.nextLabel, { color: canNext ? colors.primaryForeground : colors.mutedForeground }]}>
            {step === 2 ? "Let's go" : "Continue"}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={canNext ? colors.primaryForeground : colors.mutedForeground}
          />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 32 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  stepDots: { flexDirection: "row", gap: 6 },
  dot: { height: 6, width: 6, borderRadius: 100 },
  stepContent: { gap: 20 },
  heading: { fontSize: 28, fontFamily: "Inter_700Bold", lineHeight: 34 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 17,
    fontFamily: "Inter_400Regular",
  },
  roleGrid: { gap: 12 },
  roleCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  roleLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  roleDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sportList: { gap: 12 },
  sportRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  sportLabel: { fontSize: 17, fontFamily: "Inter_600SemiBold", flex: 1 },
  check: { marginLeft: "auto" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 100,
  },
  nextLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
