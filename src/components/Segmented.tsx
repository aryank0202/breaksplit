import React from "react";
import { View, Pressable, Text } from "react-native";
import { theme } from "../theme";

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: active ? "white" : "transparent",
              opacity: pressed ? 0.92 : 1,
              borderWidth: active ? 1 : 0,
              borderColor: active ? theme.colors.border : "transparent",
            })}
          >
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}