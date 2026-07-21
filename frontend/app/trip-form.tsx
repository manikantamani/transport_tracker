import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/src/theme";
import { DriversDB, TripsDB, VehiclesDB } from "@/src/store/database";
import { Driver, Trip, Vehicle } from "@/src/store/types";
import DateField from "@/src/components/DateField";
import ContactPickerModal from "@/src/components/ContactPickerModal";
import { callNumber } from "@/src/utils/contacts";
import { useToast } from "@/src/components/Toast";

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TripForm() {
  const router = useRouter();
  const toast = useToast();
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();

  const [title, setTitle] = useState("");
  const [bookingDate, setBookingDate] = useState<string>(date || todayYMD());
  const [bookedOnDate, setBookedOnDate] = useState<string>(todayYMD());
  const [fromLocation, setFromLocation] = useState("");
  const [fromContact, setFromContact] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [toContact, setToContact] = useState("");
  const [totalCost, setTotalCost] = useState("");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driverId, setDriverId] = useState<string | undefined>();
  const [vehicleId, setVehicleId] = useState<string | undefined>();

  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [contactPickerFor, setContactPickerFor] = useState<null | "from" | "to">(null);

  const load = useCallback(async () => {
    const [dr, ve] = await Promise.all([DriversDB.list(), VehiclesDB.list()]);
    setDrivers(dr);
    setVehicles(ve);

    if (id) {
      const trips = await TripsDB.list();
      const t = trips.find((x) => x.id === id);
      if (t) {
        setTitle(t.title);
        setBookingDate(t.bookingDate);
        setBookedOnDate(t.bookedOnDate);
        setFromLocation(t.fromLocation);
        setFromContact(t.fromContact);
        setToLocation(t.toLocation);
        setToContact(t.toContact);
        setTotalCost(String(t.totalCost));
        setDriverId(t.driverId);
        setVehicleId(t.vehicleId);
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const driver = useMemo(() => drivers.find((d) => d.id === driverId), [drivers, driverId]);
  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const onSave = async () => {
    if (!title.trim()) return toast.show("Please enter title", "error");
    if (!fromLocation.trim() || !toLocation.trim())
      return toast.show("Enter from and to locations", "error");
    const cost = parseFloat(totalCost || "0");
    if (isNaN(cost) || cost < 0) return toast.show("Enter valid cost", "error");

    const payload: Omit<Trip, "id" | "createdAt"> = {
      title: title.trim(),
      bookingDate,
      bookedOnDate,
      fromLocation: fromLocation.trim(),
      fromContact: fromContact.trim(),
      toLocation: toLocation.trim(),
      toContact: toContact.trim(),
      totalCost: cost,
      driverId,
      driverName: driver?.name,
      vehicleId,
      vehicleNumber: vehicle?.registrationNumber,
    };

    if (id) await TripsDB.update(id as string, payload);
    else await TripsDB.add(payload);
    toast.show(id ? "Trip updated" : "Trip added");
    router.back();
  };

  const onDelete = async () => {
    if (!id) return;
    await TripsDB.remove(id as string);
    toast.show("Trip deleted");
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]} testID="trip-form-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="trip-form-close">
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{id ? "Edit Trip" : "New Trip"}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field label="Trip Title *">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Delhi to Jaipur delivery"
              placeholderTextColor={colors.muted}
              testID="trip-title-input"
            />
          </Field>

          <DateField label="Trip / Booking Date *" value={bookingDate} onChange={setBookingDate} testID="trip-booking-date" />
          <DateField label="Booked On (created) *" value={bookedOnDate} onChange={setBookedOnDate} testID="trip-booked-on-date" />

          <SectionLabel icon="location" text="From" />
          <Field label="From Location *">
            <TextInput
              style={styles.input}
              value={fromLocation}
              onChangeText={setFromLocation}
              placeholder="City / warehouse name"
              placeholderTextColor={colors.muted}
              testID="trip-from-location"
            />
          </Field>
          <Field label="From Contact Number">
            <View style={styles.contactRow}>
              <TextInput
                style={[styles.input, styles.contactInput]}
                value={fromContact}
                onChangeText={setFromContact}
                placeholder="+91 ..."
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                testID="trip-from-contact"
              />
              <Pressable
                style={styles.contactIconBtn}
                onPress={() => setContactPickerFor("from")}
                testID="trip-from-contact-picker"
              >
                <Ionicons name="people" size={18} color={colors.brandPrimary} />
              </Pressable>
              <Pressable
                style={[styles.contactIconBtn, !fromContact.trim() && styles.contactIconBtnDisabled]}
                onPress={() => callNumber(fromContact)}
                disabled={!fromContact.trim()}
                testID="trip-from-contact-call"
              >
                <Ionicons
                  name="call"
                  size={18}
                  color={fromContact.trim() ? colors.success : colors.muted}
                />
              </Pressable>
            </View>
          </Field>

          <SectionLabel icon="flag" text="To" />
          <Field label="To Location *">
            <TextInput
              style={styles.input}
              value={toLocation}
              onChangeText={setToLocation}
              placeholder="Destination city / address"
              placeholderTextColor={colors.muted}
              testID="trip-to-location"
            />
          </Field>
          <Field label="To Contact Number">
            <View style={styles.contactRow}>
              <TextInput
                style={[styles.input, styles.contactInput]}
                value={toContact}
                onChangeText={setToContact}
                placeholder="+91 ..."
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                testID="trip-to-contact"
              />
              <Pressable
                style={styles.contactIconBtn}
                onPress={() => setContactPickerFor("to")}
                testID="trip-to-contact-picker"
              >
                <Ionicons name="people" size={18} color={colors.brandPrimary} />
              </Pressable>
              <Pressable
                style={[styles.contactIconBtn, !toContact.trim() && styles.contactIconBtnDisabled]}
                onPress={() => callNumber(toContact)}
                disabled={!toContact.trim()}
                testID="trip-to-contact-call"
              >
                <Ionicons
                  name="call"
                  size={18}
                  color={toContact.trim() ? colors.success : colors.muted}
                />
              </Pressable>
            </View>
          </Field>

          <SectionLabel icon="cash" text="Cost & Assignment" />
          <Field label="Total Cost (₹) *">
            <TextInput
              style={styles.input}
              value={totalCost}
              onChangeText={setTotalCost}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              testID="trip-cost-input"
            />
          </Field>

          <Field label="Driver">
            <Pressable
              style={styles.selectField}
              onPress={() => setShowDriverPicker(true)}
              testID="trip-driver-select"
            >
              <Ionicons name="person-outline" size={18} color={colors.brandPrimary} />
              <Text style={[styles.selectText, !driver && { color: colors.muted }]}>
                {driver?.name || (drivers.length ? "Select driver" : "No drivers added yet")}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
          </Field>

          <Field label="Vehicle">
            <Pressable
              style={styles.selectField}
              onPress={() => setShowVehiclePicker(true)}
              testID="trip-vehicle-select"
            >
              <Ionicons name="car-outline" size={18} color={colors.brandPrimary} />
              <Text style={[styles.selectText, !vehicle && { color: colors.muted }]}>
                {vehicle
                  ? `${vehicle.registrationNumber} · ${vehicle.model}`
                  : vehicles.length
                    ? "Select vehicle"
                    : "No vehicles added yet"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
          </Field>

          {id && (
            <Pressable style={styles.deleteBtn} onPress={onDelete} testID="trip-delete-button">
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteBtnText}>Delete Trip</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveBtn} onPress={onSave} testID="trip-save-button">
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{id ? "Update Trip" : "Save Trip"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Driver picker */}
      <PickerModal
        visible={showDriverPicker}
        title="Select Driver"
        onClose={() => setShowDriverPicker(false)}
        options={drivers.map((d) => ({ id: d.id, label: d.name, sub: d.contactNumber }))}
        selectedId={driverId}
        onSelect={(sid) => {
          setDriverId(sid);
          setShowDriverPicker(false);
        }}
        allowClear
        emptyText="No drivers added. Add them in the Fleet tab."
        testIDPrefix="driver-option"
      />

      {/* Vehicle picker */}
      <PickerModal
        visible={showVehiclePicker}
        title="Select Vehicle"
        onClose={() => setShowVehiclePicker(false)}
        options={vehicles.map((v) => ({ id: v.id, label: v.registrationNumber, sub: `${v.vehicleType} · ${v.model}` }))}
        selectedId={vehicleId}
        onSelect={(sid) => {
          setVehicleId(sid);
          setShowVehiclePicker(false);
        }}
        allowClear
        emptyText="No vehicles added. Add them in the Fleet tab."
        testIDPrefix="vehicle-option"
      />
      {/* Contact picker */}
      <ContactPickerModal
        visible={contactPickerFor !== null}
        onClose={() => setContactPickerFor(null)}
        onSelect={(c) => {
          if (contactPickerFor === "from") {
            setFromContact(c.phone);
            if (!fromLocation.trim() && c.name) setFromLocation(c.name);
          } else if (contactPickerFor === "to") {
            setToContact(c.phone);
            if (!toLocation.trim() && c.name) setToLocation(c.name);
          }
          setContactPickerFor(null);
        }}
      />
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SectionLabel({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Ionicons name={icon} size={14} color={colors.brandPrimary} />
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

interface PickerOpt {
  id: string;
  label: string;
  sub?: string;
}

function PickerModal({
  visible,
  title,
  onClose,
  options,
  selectedId,
  onSelect,
  allowClear,
  emptyText,
  testIDPrefix,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  options: PickerOpt[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  allowClear?: boolean;
  emptyText?: string;
  testIDPrefix: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 400 }}>
          {options.length === 0 ? (
            <Text style={styles.modalEmpty}>{emptyText}</Text>
          ) : (
            <>
              {allowClear && (
                <Pressable
                  style={styles.modalRow}
                  onPress={() => onSelect(undefined)}
                  testID={`${testIDPrefix}-clear`}
                >
                  <Text style={[styles.modalRowLabel, { color: colors.muted }]}>None</Text>
                </Pressable>
              )}
              {options.map((o) => {
                const sel = o.id === selectedId;
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.modalRow, sel && { backgroundColor: colors.brandTertiary }]}
                    onPress={() => onSelect(o.id)}
                    testID={`${testIDPrefix}-${o.id}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalRowLabel}>{o.label}</Text>
                      {!!o.sub && <Text style={styles.modalRowSub}>{o.sub}</Text>}
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={20} color={colors.brandPrimary} />}
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  headerTitle: { fontSize: 17, fontWeight: "500", color: colors.onSurface },
  content: { padding: spacing.lg, paddingBottom: 120 },
  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, color: colors.muted, marginBottom: 6, marginLeft: 4 },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactInput: { flex: 1 },
  contactIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  contactIconBtnDisabled: { opacity: 0.5 },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionLabelText: { fontSize: 12, color: colors.brandPrimary, fontWeight: "500", letterSpacing: 0.5 },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectText: { fontSize: 15, color: colors.onSurface, flex: 1 },
  deleteBtn: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteBtnText: { color: colors.error, fontSize: 14, fontWeight: "500" },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  saveBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: 32,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: "500", color: colors.onSurface, marginBottom: spacing.md },
  modalEmpty: { color: colors.muted, fontSize: 13, padding: spacing.lg, textAlign: "center" },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  modalRowLabel: { fontSize: 15, color: colors.onSurface, fontWeight: "500" },
  modalRowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
