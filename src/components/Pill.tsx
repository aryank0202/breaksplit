import React from "react";
import { View, Text } from "react-native";
import { theme } from "../theme";

export default function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "danger" | "info";
}) {
  const bg =
    tone === "success"
      ? "#DCFCE7"
      : tone === "danger"
      ? "#FEE2E2"
      : tone === "info"
      ? "#DBEAFE"
      : "#F3F4F6";

  const fg =
    tone === "success"
      ? "#166534"
      : tone === "danger"
      ? "#991B1B"
      : tone === "info"
      ? "#1D4ED8"
      : theme.colors.text;

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        alignSelf: "flex-start",
        backgroundColor: bg,
      }}
    >
      <Text style={{ color: fg, fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </View>
  );
}