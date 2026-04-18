import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sportColor } from "@/components/SportBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const MONOCHROME_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0A0E13" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4A5568" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0E13" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1C2530" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#253040" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#141A23" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#060A10" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1E2D3D" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0D1117" }] },
];

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
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = markers.filter(
    (m) => filter === "all" || (filter === "teams" && m.type === "team") || (filter === "tournaments" && m.type === "tournament")
  );
  const selectedMarker = filtered.find((m) => m.id === selected);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
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

      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFill}
          customMapStyle={MONOCHROME_STYLE}
          initialRegion={{ latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
        >
          {filtered.map((m) => {
            const sc = sportColor(m.sport as any);
            const isSelected = m.id === selected;
            return (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.lat, longitude: m.lng }}
                onPress={() => setSelected(m.id === selected ? null : m.id)}
              >
                <View style={[styles.markerPin, {
                  backgroundColor: sc, borderColor: isSelected ? "#fff" : sc,
                  transform: [{ scale: isSelected ? 1.25 : 1 }],
                }]}>
                  {m.type === "tournament"
                    ? <Ionicons name="trophy" size={13} color="#000" />
                    : <Ionicons name="people" size={13} color="#000" />
                  }
                </View>
              </Marker>
            );
          })}
        </MapView>

        <View style={[styles.legend, { backgroundColor: colors.card + "EE", borderColor: colors.border }]}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Teams</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Tournaments</Text>
          </View>
        </View>

        {selectedMarker && (
          <View style={[styles.callout, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calloutHeader}>
              <View style={[styles.calloutIcon, { backgroundColor: sportColor(selectedMarker.sport as any) + "22" }]}>
                {selectedMarker.type === "tournament"
                  ? <Ionicons name="trophy" size={18} color={sportColor(selectedMarker.sport as any)} />
                  : <Ionicons name="people" size={18} color={sportColor(selectedMarker.sport as any)} />
                }
              </View>
              <View style={styles.calloutInfo}>
                <Text style={[styles.calloutName, { color: colors.foreground }]}>{selectedMarker.name}</Text>
                <Text style={[styles.calloutAddr, { color: colors.mutedForeground }]}>{selectedMarker.address}</Text>
              </View>
              <Pressable onPress={() => setSelected(null)}>
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.calloutBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSelected(null);
                if (selectedMarker.type === "team") {
                  router.push({ pathname: "/team/[id]", params: { id: selectedMarker.id } });
                } else {
                  router.push({ pathname: "/tournament/[id]", params: { id: selectedMarker.id } });
                }
              }}
            >
              <Text style={[styles.calloutBtnText, { color: colors.primaryForeground }]}>
                View {selectedMarker.type === "team" ? "Team" : "Tournament"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
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
  mapContainer: { flex: 1 },
  markerPin: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  legend: { position: "absolute", top: 16, right: 16, borderRadius: 10, borderWidth: 1, padding: 10, gap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  callout: { position: "absolute", bottom: 24, left: 16, right: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  calloutHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  calloutIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  calloutInfo: { flex: 1 },
  calloutName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  calloutAddr: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  calloutBtn: { paddingVertical: 11, borderRadius: 100, alignItems: "center" },
  calloutBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
