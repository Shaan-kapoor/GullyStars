import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "accent";
  fullWidth?: boolean;
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = "primary", fullWidth }: Props) {
  const colors = useColors();

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "accent"
      ? colors.accent
      : variant === "secondary"
      ? colors.secondary
      : "transparent";

  const fg =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "accent"
      ? colors.accentForeground
      : variant === "secondary"
      ? colors.secondaryForeground
      : colors.foreground;

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.65 : 1 },
        fullWidth && { alignSelf: "stretch" },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
