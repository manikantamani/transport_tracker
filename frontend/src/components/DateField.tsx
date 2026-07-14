import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "../theme";

interface Props {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  testID?: string;
}

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateField({ label, value, onChange, testID }: Props) {
  const [show, setShow] = useState(false);
  const parsed = value ? new Date(value + "T00:00:00") : new Date();

  const handleChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setShow(false);
    if (selected) onChange(toYMD(selected));
  };

  const display =
    value
      ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Select date";

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setShow(true)} testID={testID}>
        <Ionicons name="calendar-outline" size={18} color={colors.brandPrimary} />
        <Text style={[styles.text, !value && { color: colors.muted }]}>{display}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={parsed}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}
      {Platform.OS === "ios" && show && (
        <Pressable style={styles.doneBtn} onPress={() => setShow(false)} testID={`${testID}-done`}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginLeft: 4 },
  field: {
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
  text: { fontSize: 15, color: colors.onSurface },
  doneBtn: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  doneText: { color: "#fff", fontWeight: "500" },
});
