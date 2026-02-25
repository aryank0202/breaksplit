import React from "react";
import { View, ViewStyle } from "react-native";
import { theme } from "../theme";

export default function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.bg,
          borderRadius: theme.radius.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}