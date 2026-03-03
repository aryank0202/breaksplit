import React from "react";
import { View, Text, Image } from "react-native";

export default function Avatar({
  initials,
  bgColor,
  photoURL,
}: {
  initials: string;
  bgColor: string;
  photoURL?: string;
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
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={{ width: 42, height: 42, borderRadius: 999 }}
        />
      ) : (
        <Text style={{ color: "white", fontWeight: "700" }}>{initials}</Text>
      )}
    </View>
  );
}
