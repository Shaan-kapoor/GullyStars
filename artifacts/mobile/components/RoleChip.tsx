import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { UserRole } from "@/context/AppContext";

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; fg: string }> = {
  captain: { label: "Captain", bg: "#FFB80022", fg: "#FFB800" },
  organiser: { label: "Organiser", bg: "#A855F722", fg: "#A855F7" },
  player: { label: "Player", bg: "#00C89622", fg: "#00C896" },
  fan: { label: "Fan", bg: "#64748B22", fg: "#94A3B8" },
};

export function RoleChip({ role }: { role: UserRole }) {
  const config = ROLE_CONFIG[role];
  return (
    <View style={[styles.chip, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
