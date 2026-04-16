import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sportColor } from "@/components/SportBadge";
import { useColors } from "@/hooks/useColors";

type MarkerType = "team" | "tournament";
export interface GeoMapMarker {
  id: string;
  type: MarkerType;
  name: string;
  sport: string;
  lat: number;
  lng: number;
  address: string;
}

export default function MapViewComponent({
  markers,
  filter,
  setFilter,
}: {
  markers: GeoMapMarker[];
  filter: "all" | "teams" | "tournaments";
  setFilter: (f: "all" | "teams" | "tournaments") => void;
}) {
  const colors = useColors();
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = markers.filter(
    (m) => filter === "all" || (filter === "teams" && m.type === "team") || (filter === "tournaments" && m.type === "tournament")
  );
  const selectedMarker = filtered.find((m) => m.id === selected);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Map</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Teams and tournaments near you</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {(["all", "teams", "tournaments"] as const).map((f) => (
              <Pressable
                key={f}
                style={[styles.filterChip, { backgroundColor: filter === f ? colors.primary : colors.secondary, marginRight: 8 }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>
        <View style={[styles.webBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="map" size={32} color={colors.mutedForeground} />
          <Text style={[styles.webBannerTitle, { color: colors.foreground }]}>Interactive map on mobile</Text>
          <Text style={[styles.webBannerSub, { color: colors.mutedForeground }]}>
            Open in Expo Go to see teams and tournaments geo-marked on a live black-and-white map
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {filtered.map((m) => {
            const sc = sportColor(m.sport as any);
            const isSelected = selected === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.listItem, { backgroundColor: isSelected ? sc + "12" : colors.card, borderColor: isSelected ? sc : colors.border }]}
                onPress={() => setSelected(isSelected ? null : m.id)}
              >
                <View style={[styles.listIcon, { backgroundColor: sc + "22" }]}>
                  {m.type === "tournament"
                    ? <Ionicons name="trophy" size={18} color={sc} />
                    : <Ionicons name="people" size={18} color={sc} />
                  }
                </View>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: colors.foreground }]}>{m.name}</Text>
                  <Text style={[styles.listAddr, { color: colors.mutedForeground }]}>{m.address}</Text>
                </View>
                <View style={[styles.typePill, { backgroundColor: m.type === "tournament" ? colors.accent + "22" : colors.primary + "22" }]}>
                  <Text style={[styles.typePillText, { color: m.type === "tournament" ? colors.accent : colors.primary }]}>
                    {m.type === "tournament" ? "Cup" : "Team"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedMarker && (
          <Pressable
            style={[styles.viewBtn, { backgroundColor: colors.primary, marginHorizontal: 20, marginTop: 16 }]}
            onPress={() => {
              if (selectedMarker.type === "team") {
                router.push({ pathname: "/team/[id]", params: { id: selectedMarker.id } });
              } else {
                router.push({ pathname: "/tournament/[id]", params: { id: selectedMarker.id } });
              }
            }}
          >
            <Text style={[styles.viewBtnText, { color: colors.primaryForeground }]}>
              View {selectedMarker.name}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, gap: 4 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  filterRow: { flexDirection: "row" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  webBanner: { margin: 20, borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8, marginBottom: 16 },
  webBannerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  webBannerSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  listItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  listIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  listInfo: { flex: 1 },
  listName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  listAddr: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  typePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  viewBtn: { paddingVertical: 14, borderRadius: 100, alignItems: "center" },
  viewBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
