import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";

type ToastType = "success" | "error" | "info";

interface ToastCtx {
  show: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ show: () => {} });

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; type: ToastType } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (text: string, type: ToastType = "success") => {
      setMsg({ text, type });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(
            () => setMsg(null),
          );
        }, 1800);
      });
    },
    [opacity],
  );

  const bg =
    msg?.type === "error" ? colors.error : msg?.type === "info" ? colors.info : colors.success;

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {msg && (
        <Animated.View
          pointerEvents="none"
          testID="toast-container"
          style={[styles.wrap, { opacity, backgroundColor: bg }]}
        >
          <Text style={styles.text} testID="toast-text">
            {msg.text}
          </Text>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
