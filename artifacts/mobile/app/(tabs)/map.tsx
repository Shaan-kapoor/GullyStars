import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapViewComponent, { GeoMapMarker } from "@/components/MapViewComponent";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { teams, tournaments } = useApp();
  const [filter, setFilter] = useState<"all" | "teams" | "tournaments">("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const markers: GeoMapMarker[] = [
    ...teams
      .filter((t) => !!t.location)
      .map((t) => ({
        id: t.id, type: "team" as const, name: t.name, sport: t.sport,
        lat: t.location!.lat, lng: t.location!.lng, address: t.location!.address,
      })),
    ...tournaments
      .filter((t) => !!t.location)
      .map((t) => ({
        id: t.id, type: "tournament" as const, name: t.name, sport: t.sport,
        lat: t.location!.lat, lng: t.location!.lng, address: t.location!.address,
      })),
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? topPad : 0 }]}>
      <MapViewComponent markers={markers} filter={filter} setFilter={setFilter} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
