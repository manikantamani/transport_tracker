import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, formatINR, radius, spacing } from "@/src/theme";
import { TripsDB } from "@/src/store/database";
import { Trip } from "@/src/store/types";
import { callNumber, openMapDirections } from "@/src/utils/contacts";

type Filter = "all" | "past" | "future";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "future", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setTrips(await TripsDB.list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return trips
      .filter((t) => {
        const d = new Date(t.bookingDate + "T00:00:00");
        if (filter === "past") return d < today;
        if (filter === "future") return d >= today;
        return true;
      })
      .sort((a, b) => (a.bookingDate < b.bookingDate ? 1 : -1));
  }, [trips, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="trips-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Trips</Text>
        <Text style={styles.subtitle}>{trips.length} total logged</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
              testID={`trip-filter-${f.key}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty} testID="trips-empty">
            <Ionicons name="clipboard-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySub}>Tap the + button to log your first trip</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPast = new Date(item.bookingDate + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: "/trip-form", params: { id: item.id } })}
              testID={`trip-card-${item.id}`}
            >
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDate}>
                    {new Date(item.bookingDate + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Pressable
                  style={styles.mapBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    openMapDirections(item.fromLocation, item.toLocation);
                  }}
                  testID={`trip-${item.id}-map`}
                >
                  <Ionicons name="navigate" size={16} color="#fff" />
                </Pressable>
                <View style={[styles.badge, { backgroundColor: isPast ? colors.surfaceTertiary : colors.brandTertiary }]}>
                  <Text style={[styles.badgeText, { color: isPast ? colors.muted : colors.onBrandTertiary }]}>
                    {isPast ? "Completed" : "Upcoming"}
                  </Text>
                </View>
              </View>

              <View style={styles.routeWrap}>
                <View style={styles.routeLine}>
                  <View style={styles.dotFrom} />
                  <View style={styles.dashLine} />
                  <View style={styles.dotTo} />
                </View>
                <View style={{ flex: 1, gap: 12 }}>
                  <View>
                    <Text style={styles.routeLabel}>FROM</Text>
                    <Text style={styles.routeName} numberOfLines={1}>{item.fromLocation}</Text>
                    {!!item.fromContact && (
                      <Pressable
                        style={styles.contactPressable}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          callNumber(item.fromContact);
                        }}
                        testID={`trip-${item.id}-call-from`}
                      >
                        <Ionicons name="call" size={12} color={colors.success} />
                        <Text style={styles.routeContact}>{item.fromContact}</Text>
                      </Pressable>
                    )}
                  </View>
                  <View>
                    <Text style={styles.routeLabel}>TO</Text>
                    <Text style={styles.routeName} numberOfLines={1}>{item.toLocation}</Text>
                    {!!item.toContact && (
                      <Pressable
                        style={styles.contactPressable}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          callNumber(item.toContact);
                        }}
                        testID={`trip-${item.id}-call-to`}
                      >
                        <Ionicons name="call" size={12} color={colors.success} />
                        <Text style={styles.routeContact}>{item.toContact}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.footerLeft}>
                  {!!item.driverName && (
                    <View style={styles.pill}>
                      <Ionicons name="person" size={11} color={colors.onBrandTertiary} />
                      <Text style={styles.pillText}>{item.driverName}</Text>
                    </View>
                  )}
                  {!!item.vehicleNumber && (
                    <View style={styles.pill}>
                      <Ionicons name="car" size={11} color={colors.onBrandTertiary} />
                      <Text style={styles.pillText}>{item.vehicleNumber}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cost}>{formatINR(item.totalCost)}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/trip-form")}
        testID="add-trip-fab"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "500", color: colors.onSurface },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chipRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.md,
    height: 56,
    alignItems: "center",
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurface, fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  listContent: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  emptyText: { fontSize: 16, color: colors.onSurface, fontWeight: "500" },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: "center" },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "500", color: colors.onSurface },
  cardDate: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: "500" },
  mapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  routeWrap: { flexDirection: "row", marginTop: spacing.md, gap: spacing.md },
  routeLine: { width: 16, alignItems: "center", paddingTop: 6 },
  dotFrom: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandPrimary },
  dashLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  dotTo: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandSecondary },
  routeLabel: { fontSize: 10, color: colors.muted, letterSpacing: 0.5 },
  routeName: { fontSize: 14, color: colors.onSurface, fontWeight: "500", marginTop: 2 },
  routeContact: { fontSize: 12, color: colors.muted },
  contactPressable: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerLeft: { flexDirection: "row", flex: 1, flexWrap: "wrap", gap: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillText: { color: colors.onBrandTertiary, fontSize: 11, fontWeight: "500" },
  cost: { fontSize: 15, fontWeight: "500", color: colors.brandPrimary },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
