import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider,SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/src/theme";
import { DriversDB, VehiclesDB } from "@/src/store/database";
import { Driver, Vehicle } from "@/src/store/types";

type Tab = "vehicles" | "drivers";

export default function Fleet() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("vehicles");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const load = useCallback(async () => {
    const [v, d] = await Promise.all([VehiclesDB.list(), DriversDB.list()]);
    setVehicles(v);
    setDrivers(d);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onAdd = () => {
    if (tab === "vehicles") router.push("/vehicle-form");
    else router.push("/driver-form");
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flexDirection: 'column', flex:1, width:'100%', backgroundColor:'white'}} >
        
          <View style={styles.header}>
        <Text style={styles.title}>Fleet</Text>
        <Text style={styles.subtitle}>
          {vehicles.length} Vehicles . {drivers.length} Drivers
        </Text>
      </View>
          <ScrollView
        horizontal style={{maxHeight:56, padding:16, gap:16}}
      >
        {(["vehicles", "drivers"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabChip, active && styles.tabChipActive, {marginEnd:10}]}
              testID={`fleet-tab-${t}`}
            >
              <Ionicons
                name={t === "vehicles" ? "car" : "person"}
                size={16}
                color={active ? "#fff" : colors.onSurface}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t === "vehicles" ? "Vehicles" : "Drivers"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
        
      

        <View style={{flex:1, padding:0, alignSelf: 'stretch', gap:16}}>

          
            {tab === "vehicles" ? (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty} testID="vehicles-empty">
              <Ionicons name="car-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No vehicles yet</Text>
              <Text style={styles.emptySub}>Add trucks, vans, and cars to your fleet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.vehicleCard}
              onPress={() => router.push({ pathname: "/vehicle-form", params: { id: item.id } })}
              testID={`vehicle-card-${item.id}`}
            >
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.vehiclePhoto} />
              ) : (
                <View style={[styles.vehiclePhoto, styles.photoPlaceholder]}>
                  <Ionicons name="car" size={36} color={colors.muted} />
                </View>
              )}
              <View style={styles.vehicleBody}>
                <Text style={styles.vehicleReg}>{item.registrationNumber}</Text>
                <Text style={styles.vehicleModel}>{item.model}</Text>
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{item.vehicleType}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty} testID="drivers-empty">
              <Ionicons name="people-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No drivers yet</Text>
              <Text style={styles.emptySub}>Add drivers with their details</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.driverCard}
              onPress={() => router.push({ pathname: "/driver-form", params: { id: item.id } })}
              testID={`driver-card-${item.id}`}
            >
              {item.profilePic ? (
                <Image source={{ uri: item.profilePic }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>
                    {item.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{item.name}</Text>
                <Text style={styles.driverContact}>📞 {item.contactNumber}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
          </View>
            <Pressable style={styles.fab} onPress={onAdd} testID="add-fleet-fab">
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          </SafeAreaView>
       </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface, alignSelf: 'stretch'},
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "500", color: colors.onSurface },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  tabRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.md,
    height: 56,
    alignItems: "center",
  },
  tabChip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    flexShrink: 0,
  },
  tabChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  tabText: { color: colors.onSurface, fontSize: 13, fontWeight: "500" },
  tabTextActive: { color: "#fff" },
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
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehiclePhoto: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  vehicleBody: { flex: 1, gap: 2 },
  vehicleReg: { fontSize: 15, fontWeight: "500", color: colors.onSurface },
  vehicleModel: { fontSize: 13, color: colors.muted },
  typePill: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  typePillText: { color: colors.onBrandTertiary, fontSize: 11, fontWeight: "500" },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandTertiary },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: colors.onBrandTertiary, fontWeight: "500", fontSize: 16 },
  driverName: { fontSize: 15, fontWeight: "500", color: colors.onSurface },
  driverContact: { fontSize: 13, color: colors.muted, marginTop: 2 },
  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: 70,
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
