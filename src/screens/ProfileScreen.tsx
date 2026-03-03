import React, { useMemo } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { useTrip } from "../state/TripStore";
import { auth } from "../firebase";
import { theme } from "../theme";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentUser, resetStore } = useTrip();

  async function onLogout() {
    await signOut(auth);
    resetStore();
  }

  const displayName = currentUser?.displayName ?? "User";
  const email = currentUser?.email ?? "";
  const avatarText = useMemo(() => initialsFromName(displayName), [displayName]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {currentUser?.photoURL ? (
            <Image source={{ uri: currentUser.photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarText}</Text>
            </View>
          )}
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <Pressable style={styles.itemRow} onPress={() => navigation.navigate("EditProfile")}>
            <View style={[styles.itemIconWrap, { backgroundColor: "#DBEAFE" }]}>
              <Feather name="user" size={18} color="#2563EB" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Edit Profile</Text>
              <Text style={styles.itemSubtitle}>Update your name and email</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { paddingBottom: 0 }]}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <Pressable onPress={onLogout} style={styles.itemRow}>
            <View style={[styles.itemIconWrap, { backgroundColor: "#FEE2E2" }]}>
              <Feather name="log-out" size={18} color="#DC2626" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.logoutText}>Log Out</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTop}>BreakSplit v1.0.0</Text>
          <Text style={styles.footerBottom}>Made with love for college students</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "800",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  profileCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 18,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarText: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
  name: {
    marginTop: 10,
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  email: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
    paddingBottom: 2,
  },
  sectionTitle: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  itemSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 16,
  },
  footer: {
    marginTop: 12,
    alignItems: "center",
    gap: 4,
  },
  footerTop: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  footerBottom: {
    color: "#A1A1AA",
    fontSize: 12,
  },
});
