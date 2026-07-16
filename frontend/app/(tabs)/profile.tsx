import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/src/theme";
import { ProfileDB } from "@/src/store/database";
import { useToast } from "@/src/components/Toast";

export default function ProfileScreen() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const p = await ProfileDB.get();
    setName(p.name || "");
    setMobile(p.mobile || "");
    setEmail(p.email || "");
    setCompany(p.company || "");
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onSave = async () => {
    if (!mobile.trim() && !email.trim()) {
      toast.show("Enter mobile or email", "error");
      return;
    }
    setSaving(true);
    await ProfileDB.save({ name: name.trim(), mobile: mobile.trim(), email: email.trim(), company: company.trim() });
    setSaving(false);
    toast.show("Profile saved");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="profile-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Profile</Text>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.avatarName}>{name || "Your Name"}</Text>
            <Text style={styles.avatarCompany}>{company || "Transport Company"}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.muted}
              testID="profile-name-input"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              testID="profile-mobile-input"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="profile-email-input"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Company (optional)</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Company name"
              placeholderTextColor={colors.muted}
              testID="profile-company-input"
            />
          </View>

          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={onSave}
            disabled={saving}
            testID="profile-save-button"
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>

          <View style={styles.aboutBox}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>
              Krishnaveni Transport keeps your trips, drivers, and vehicles safely on-device. All your data lives
              locally in this app — no cloud sync.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: "500", color: colors.onSurface, marginBottom: spacing.lg },
  avatarWrap: { alignItems: "center", marginBottom: spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.onBrandTertiary, fontSize: 32, fontWeight: "500" },
  avatarName: { fontSize: 18, fontWeight: "500", color: colors.onSurface, marginTop: spacing.md },
  avatarCompany: { fontSize: 13, color: colors.muted, marginTop: 2 },
  formGroup: { marginBottom: spacing.md },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginLeft: 4 },
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
  saveBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  aboutBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
  },
  aboutTitle: { fontSize: 13, fontWeight: "500", color: colors.onBrandTertiary, marginBottom: 4 },
  aboutText: { fontSize: 12, color: colors.onBrandTertiary, lineHeight: 18 },
});
