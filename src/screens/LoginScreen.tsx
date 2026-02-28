import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../theme";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandWrap}>
          <Feather name="umbrella" size={46} color={theme.colors.primary} />
          <Text style={styles.brandTitle}>BreakSplit</Text>
          <Text style={styles.brandSubtitle}>Plan it. Split it. Send it.</Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@college.edu"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            style={styles.input}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("TripHome")}>
          <Text style={styles.primaryButtonText}>Log In</Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account?</Text>
          <Pressable onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.switchLink}> Sign Up</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>By continuing, you agree to our Terms & Privacy Policy</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 70,
    paddingBottom: 26,
    gap: 16,
  },
  brandWrap: {
    alignItems: "center",
    marginBottom: 22,
  },
  brandTitle: {
    marginTop: 18,
    fontSize: 40,
    fontWeight: "800",
    color: "#111827",
  },
  brandSubtitle: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 15,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
    color: "#111827",
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  switchText: {
    color: "#1F2937",
    fontSize: 13,
  },
  switchLink: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  footerText: {
    marginTop: "auto",
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
  },
});
