import React from "react";
import { Pressable, Text } from "react-native";
import { theme } from "../theme";

export default function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? "#DBEAFE" : "white",
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text
        style={{
          fontWeight: "800",
          color: selected ? theme.colors.primary : theme.colors.text,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}