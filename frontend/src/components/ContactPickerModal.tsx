import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "../theme";
import { PickedContact, listContacts } from "../utils/contacts";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (c: PickedContact) => void;
}

export default function ContactPickerModal({ visible, onClose, onSelect }: Props) {
  const [all, setAll] = useState<PickedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      const items = await listContacts();
      setAll(items);
      setLoading(false);
    })();
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\s+/g, "").includes(q),
    );
  }, [all, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="contact-picker-backdrop" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Select Contact</Text>
          <Pressable onPress={onClose} testID="contact-picker-close">
            <Ionicons name="close" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            style={styles.search}
            placeholder="Search name or number"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            testID="contact-picker-search"
          />
        </View>

        {loading ? (
          <Text style={styles.hint}>Loading contacts…</Text>
        ) : all.length === 0 ? (
          <Text style={styles.hint}>
            No contacts available. Grant contacts permission in device settings, or paste the number
            manually.
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
            {filtered.slice(0, 300).map((c, idx) => (
              <Pressable
                key={`${c.phone}-${idx}`}
                style={styles.row}
                onPress={() => {
                  onSelect(c);
                  onClose();
                }}
                testID={`contact-row-${idx}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(c.name || "?").trim().charAt(0).toUpperCase() || "#"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name || "(no name)"}</Text>
                  <Text style={styles.phone}>{c.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}
            {filtered.length === 0 && <Text style={styles.hint}>No matches</Text>}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: "500", color: colors.onSurface },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  search: { flex: 1, fontSize: 14, color: colors.onSurface, padding: 0 },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.onBrandTertiary, fontWeight: "500" },
  name: { fontSize: 14, fontWeight: "500", color: colors.onSurface },
  phone: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
