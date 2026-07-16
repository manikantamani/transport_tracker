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
import { DriversDB } from "@/src/store/database";
import { Driver } from "@/src/store/types";
import { pickImageBase64 } from "@/src/utils/imagePicker";
import { useToast } from "@/src/components/Toast";

export default function DriverForm() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [profilePic, setProfilePic] = useState<string | undefined>();
  const [licenseDoc, setLicenseDoc] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!id) return;
    const list = await DriversDB.list();
    const d = list.find((x) => x.id === id);
    if (d) {
      setName(d.name);
      setContactNumber(d.contactNumber);
      setProfilePic(d.profilePic);
      setLicenseDoc(d.licenseDoc);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onPickAvatar = async () => {
    const b64 = await pickImageBase64();
    if (b64) setProfilePic(b64);
  };

  const onPickLicense = async () => {
    const b64 = await pickImageBase64();
    if (b64) setLicenseDoc(b64);
  };

  const onSave = async () => {
    if (!name.trim()) return toast.show("Enter driver name", "error");
    if (!contactNumber.trim()) return toast.show("Enter contact number", "error");

    const payload: Omit<Driver, "id" | "createdAt"> = {
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      profilePic,
      licenseDoc,
    };

    if (id) await DriversDB.update(id as string, payload);
    else await DriversDB.add(payload);
    toast.show(id ? "Driver updated" : "Driver added");
    router.back();
  };

  const onDelete = async () => {
    if (!id) return;
    await DriversDB.remove(id as string);
    toast.show("Driver deleted");
    router.back();
  };

  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

    

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]} testID="driver-form-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="driver-form-close">
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{id ? "Edit Driver" : "New Driver"}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <Pressable onPress={onPickAvatar} testID="driver-avatar-picker">
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change profile photo</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Driver full name"
              placeholderTextColor={colors.muted}
              testID="driver-name-input"
            />
          </View>
<Text style={[styles.label, { marginTop: spacing.md }]}>Contact Number *</Text>
          <View
  style={{
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  }}
>
  
  <TextInput
    style={[styles.input, { flex: 1 }]}
    value={contactNumber}
    onChangeText={setContactNumber}
    placeholder="+91 98765 43210"
    placeholderTextColor={colors.muted}
    keyboardType="phone-pad"
    testID="driver-contact-input"
  />

  <Pressable
    onPress={() => {
      console.log("Icon pressed");
    }}
    hitSlop={8}
  >
    <Ionicons
      name="call"
      size={22}
      color={colors.brand}
    />
  </Pressable>
</View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>License Document</Text>
          <Pressable style={styles.uploadBox} onPress={onPickLicense} testID="driver-license-upload">
            {licenseDoc ? (
              <Image source={{ uri: licenseDoc }} style={styles.uploadedImg} />
            ) : (
              <View style={styles.uploadEmpty}>
                <Ionicons name="card-outline" size={28} color={colors.brandPrimary} />
                <Text style={styles.uploadText}>Tap to add license document</Text>
              </View>
            )}
          </Pressable>

          {id && (
            <Pressable style={styles.deleteBtn} onPress={onDelete} testID="driver-delete-button">
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteBtnText}>Delete Driver</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveBtn} onPress={onSave} testID="driver-save-button">
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{id ? "Update Driver" : "Save Driver"}</Text>
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
  avatarWrap: { alignItems: "center", marginBottom: spacing.lg },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.brandTertiary },
  avatarEmpty: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: colors.onBrandTertiary, fontSize: 32, fontWeight: "500" },
  avatarBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarHint: { marginTop: spacing.sm, color: colors.muted, fontSize: 12 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginLeft: 4 },
  formGroup: { marginTop: spacing.md },
input: {
  flex: 1,
  backgroundColor: colors.surfaceSecondary,
  borderRadius: radius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  fontSize: 15,
  color: colors.onSurface,
  borderWidth: 1,
  borderColor: colors.border,
},
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
