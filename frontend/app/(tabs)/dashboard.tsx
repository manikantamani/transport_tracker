import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Icon, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, formatINR, radius, spacing } from "@/src/theme";
import { TripsDB } from "@/src/store/database";
import { Trip } from "@/src/store/types";

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelFor(d: Date) {
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    iso: ymd(d),
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(ymd(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const dateStripRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    const list = await TripsDB.list();
    setTrips(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Build date range -30 to +30
  const dates = useMemo(() => {
    const arr: ReturnType<typeof labelFor>[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = -30; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(labelFor(d));
    }
    return arr;
  }, []);

  const todayIso = ymd(new Date());
  const todayIndex = dates.findIndex((d) => d.iso === todayIso);

  // KPIs
  const { totalTrips, revenue30 } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const past30 = new Date(now);
    past30.setDate(now.getDate() - 30);
    let revenue = 0;
    trips.forEach((t) => {
      const d = new Date(t.bookingDate + "T00:00:00");
      if (d >= past30 && d <= now) revenue += t.totalCost || 0;
    });
    return { totalTrips: trips.length, revenue30: revenue };
  }, [trips]);

  const tripsForSelected = useMemo(
    () =>
      trips
        .filter((t) => t.bookingDate === selectedDate)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [trips, selectedDate],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="dashboard-screen">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName} testID="dashboard-title">
            Krishnaveni Transport
          </Text>
        </View>
        <View style={styles.logoCircle}>
          <Image source={require("../../assets/images/truck_white.png")}  style={{
    width: 30,
    height: 30,
  }}/>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: colors.brandPrimary }]} testID="kpi-total-trips">
            <View style={styles.kpiIcon}>
              <Ionicons name="map" size={20} color="#fff" />
            </View>
            <Text style={styles.kpiValue}>{totalTrips}</Text>
            <Text style={styles.kpiLabel}>Total Trips</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.brandSecondary }]} testID="kpi-revenue">
            <View style={styles.kpiIcon}>
              <Ionicons name="cash" size={20} color="#fff" />
            </View>
            <Text style={styles.kpiValue}>{formatINR(revenue30)}</Text>
            <Text style={styles.kpiLabel}>Revenue (30d)</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Pressable
            onPress={() => {
              setSelectedDate(todayIso);
              dateStripRef.current?.scrollToIndex({ index: todayIndex, animated: true, viewPosition: 0.5 });
            }}
            testID="jump-today-button"
          >
            <Text style={styles.linkText}>Today</Text>
          </Pressable>
        </View>

        <FlatList
          ref={dateStripRef}
          data={dates}
          keyExtractor={(item) => item.iso}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
          initialScrollIndex={todayIndex}
          getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
          
          renderItem={({ item }) => {
            const active = item.iso === selectedDate;
            const isToday = item.iso === todayIso;
            return (
              <Pressable
                onPress={() => setSelectedDate(item.iso)}
                style={[styles.dateChip, active && styles.dateChipActive]}
                testID={`date-chip-${item.iso}`}
              >
                <Text style={[styles.dateDay, active && styles.dateActiveText]}>{item.day}</Text>
                <Text style={[styles.dateNum, active && styles.dateActiveText]}>{item.date}</Text>
                <Text style={[styles.dateMonth, active && styles.dateActiveText]}>{item.month}</Text>
                {isToday && !active && <View style={styles.todayDot} />}
              </Pressable>
            );
          }
        }
        />

        {/* Trips for selected day */}
        <View style={styles.tripsSection}>
          <Text style={styles.sectionTitle}>
            Trips on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </Text>

          {tripsForSelected.length === 0 ? (
            <View style={styles.emptyBox} testID="dashboard-empty">
              <Ionicons name="calendar-outline" size={40} color={colors.muted} />
              <Text style={styles.emptyText}>No trips on this day</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push({ pathname: "/trip-form", params: { date: selectedDate } })}
                testID="empty-add-trip-button"
              >
                <Text style={styles.emptyBtnText}>+ Add Trip</Text>
              </Pressable>
            </View>
          ) : (
            tripsForSelected.map((t) => (
              <Pressable
                key={t.id}
                style={styles.tripCard}
                onPress={() => router.push({ pathname: "/trip-form", params: { id: t.id } })}
                testID={`dashboard-trip-${t.id}`}
              >
                <View style={styles.tripCardHead}>
                  <Text style={styles.tripTitle} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Text style={styles.tripCost}>{formatINR(t.totalCost)}</Text>
                </View>
                <View style={styles.route}>
                  <View style={styles.routeDot} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {t.fromLocation}
                  </Text>
                </View>
                <View style={styles.route}>
                  <View style={[styles.routeDot, { backgroundColor: colors.brandSecondary }]} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {t.toLocation}
                  </Text>
                </View>
                <View style={styles.tripFooter}>
                  {!!t.driverName && (
                    <View style={styles.tag}>
                      <Ionicons name="person" size={12} color={colors.onBrandTertiary} />
                      <Text style={styles.tagText}>{t.driverName}</Text>
                    </View>
                  )}
                  {!!t.vehicleNumber && (
                    <View style={styles.tag}>
                      <Ionicons name="car" size={12} color={colors.onBrandTertiary} />
                      <Text style={styles.tagText}>{t.vehicleNumber}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hello: { color: colors.muted, fontSize: 13 },
  appName: { color: colors.onSurface, fontSize: 24, fontWeight: "500", marginTop: 2 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiRow: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  kpiCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 110,
    justifyContent: "space-between",
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { color: "#fff", fontSize: 22, fontWeight: "500", marginTop: 12 },
  kpiLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  timelineHeader: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "500", color: colors.onSurface },
  linkText: { color: colors.brandPrimary, fontSize: 14, fontWeight: "500" },
  dateStrip: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dateChip: {
    width: 56,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dateChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  dateDay: { fontSize: 10, color: colors.muted, textTransform: "uppercase" },
  dateNum: { fontSize: 18, color: colors.onSurface, fontWeight: "500", marginTop: 2 },
  dateMonth: { fontSize: 10, color: colors.muted, marginTop: 2 },
  dateActiveText: { color: "#fff" },
  todayDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brandPrimary,
  },
  tripsSection: { paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.md },
  emptyBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.muted, fontSize: 13 },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  emptyBtnText: { color: "#fff", fontWeight: "500", fontSize: 13 },
  tripCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tripCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tripTitle: { fontSize: 15, fontWeight: "500", color: colors.onSurface, flex: 1, marginRight: 8 },
  tripCost: { fontSize: 15, fontWeight: "500", color: colors.brandPrimary },
  route: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandPrimary,
  },
  routeText: { color: colors.onSurfaceSecondary, fontSize: 13, flex: 1 },
  tripFooter: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: { color: colors.onBrandTertiary, fontSize: 11, fontWeight: "500" },
});
