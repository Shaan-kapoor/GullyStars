import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Sport } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  cricket: { label: "Cricket", icon: "cricket", color: "#FF6B35" },
  football: { label: "Football", icon: "soccer", color: "#4ECDC4" },
  basketball: { label: "Basketball", icon: "basketball", color: "#FFE66D" },
};

export function SportBadge({ sport, size = "sm" }: { sport: Sport; size?: "sm" | "md" }) {
  const colors = useColors();
  const config = SPORT_CONFIG[sport];
  const isLg = size === "md";

  return (
    <View style={[styles.badge, { backgroundColor: config.color + "22", borderColor: config.color + "44" }]}>
      <MaterialCommunityIcons name={config.icon as any} size={isLg ? 14 : 11} color={config.color} />
      {isLg && <Text style={[styles.label, { color: config.color, fontSize: 12 }]}>{config.label}</Text>}
    </View>
  );
}

export function sportColor(sport: Sport) {
  return SPORT_CONFIG[sport].color;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
  },
});
