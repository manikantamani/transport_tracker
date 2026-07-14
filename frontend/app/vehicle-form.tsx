import { useCallback, useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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
import { VehiclesDB } from "@/src/store/database";
import { Vehicle } from "@/src/store/types";
import { pickImageBase64 } from "@/src/utils/imagePicker";
import { useToast } from "@/src/components/Toast";

const VEHICLE_TYPES = ["Truck", "Van", "Car", "Bus", "Mini Truck", "Trailer", "Pickup"];

export default function VehicleForm() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [vehicleType, setVehicleType] = useState("Truck");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [registrationDoc, setRegistrationDoc] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!id) return;
    const list = await VehiclesDB.list();
    const v = list.find((x) => x.id === id);
    if (v) {
      setVehicleType(v.vehicleType);
      setModel(v.model);
      setRegistrationNumber(v.registrationNumber);
      setPhoto(v.photo);
      setRegistrationDoc(v.registrationDoc);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onPickPhoto = async () => {
    const b64 = await pickImageBase64();
    if (b64) setPhoto(b64);
  };

  const onPickDoc = async () => {
    const b64 = await pickImageBase64();
    if (b64) setRegistrationDoc(b64);
  };

  const onSave = async () => {
    if (!registrationNumber.trim()) return toast.show("Enter registration number", "error");
    if (!model.trim()) return toast.show("Enter model", "error");

    const payload: Omit<Vehicle, "id" | "createdAt"> = {
      vehicleType,
      model: model.trim(),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      photo,
      registrationDoc,
    };

    if (id) await VehiclesDB.update(id as string, payload);
    else await VehiclesDB.add(payload);
    toast.show(id ? "Vehicle updated" : "Vehicle added");
    router.back();
  };

  const onDelete = async () => {
    if (!id) return;
    await VehiclesDB.remove(id as string);
    toast.show("Vehicle deleted");
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]} testID="vehicle-form-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="vehicle-form-close">
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{id ? "Edit Vehicle" : "New Vehicle"}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Vehicle Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeRow}
          >
            {VEHICLE_TYPES.map((t) => {
              const active = t === vehicleType;
              return (
                <Pressable
                  key={t}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => setVehicleType(t)}
                  testID={`vehicle-type-${t}`}
                >
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{t}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="e.g., Tata 407 / Ashok Leyland Dost"
              placeholderTextColor={colors.muted}
              testID="vehicle-model-input"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Registration Number *</Text>
            <TextInput
              style={styles.input}
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              placeholder="MH01AB1234"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              testID="vehicle-reg-input"
            />
          </View>

          <Text style={styles.label}>Vehicle Photo</Text>
          <Pressable style={styles.uploadBox} onPress={onPickPhoto} testID="vehicle-photo-upload">
            {photo ? (
              <Image source={{ uri: photo }} style={styles.uploadedImg} />
            ) : (
              <View style={styles.uploadEmpty}>
                <Ionicons name="camera-outline" size={28} color={colors.brandPrimary} />
                <Text style={styles.uploadText}>Tap to add photo</Text>
              </View>
            )}
          </Pressable>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Registration Document (RC)</Text>
          <Pressable style={styles.uploadBox} onPress={onPickDoc} testID="vehicle-doc-upload">
            {registrationDoc ? (
              <Image source={{ uri: registrationDoc }} style={styles.uploadedImg} />
            ) : (
              <View style={styles.uploadEmpty}>
                <Ionicons name="document-attach-outline" size={28} color={colors.brandPrimary} />
                <Text style={styles.uploadText}>Tap to add RC document</Text>
              </View>
            )}
          </Pressable>

          {id && (
            <Pressable style={styles.deleteBtn} onPress={onDelete} testID="vehicle-delete-button">
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteBtnText}>Delete Vehicle</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveBtn} onPress={onSave} testID="vehicle-save-button">
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{id ? "Update Vehicle" : "Save Vehicle"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginLeft: 4 },
  formGroup: { marginTop: spacing.md },
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
  typeRow: { gap: spacing.sm, paddingVertical: 4, paddingRight: spacing.md, height: 44, alignItems: "center" },
  typeChip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  typeChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  typeChipText: { color: colors.onSurface, fontSize: 13, fontWeight: "500" },
  typeChipTextActive: { color: "#fff" },
  uploadBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadEmpty: { alignItems: "center", gap: 6 },
  uploadText: { color: colors.brandPrimary, fontSize: 13, fontWeight: "500" },
  uploadedImg: { width: "100%", height: 180, resizeMode: "cover" },
  deleteBtn: {
    marginTop: spacing.xl,
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
});
