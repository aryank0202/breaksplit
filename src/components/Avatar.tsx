import React from "react";
import { View, Text } from "react-native";
import { theme } from "../theme";

export default function Avatar({
  initials,
  bgColor,
}: {
  initials: string;
  bgColor: string;
}) {
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 999,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "700" }}>{initials}</Text>
    </View>
  );
}