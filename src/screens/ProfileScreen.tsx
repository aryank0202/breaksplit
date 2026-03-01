import React, { useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { theme } from "../theme";
import { useTrip } from "../state/TripStore";
import { getUser, upsertUserProfile } from "../api/users";
import { auth } from "../firebase";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser, resetStore } = useTrip();
  const [displayName, setDisplayName] = useState("");
  const [venmoHandle, setVenmoHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const userDoc = await getUser(currentUser.uid);
        if (!userDoc) return;
        setDisplayName(userDoc.displayName);
        setVenmoHandle(userDoc.venmoHandle ?? "");
      } catch (error: any) {
        Alert.alert("Error", error?.message ?? "Could not load profile.");
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, [currentUser?.uid]);

  async function onSave() {
    if (!currentUser?.uid) return;
    if (!displayName.trim()) {
      Alert.alert("Name required", "Please enter a display name.");
      return;
    }
    setSaving(true);
    try {
      await upsertUserProfile(currentUser.uid, {
        displayName: displayName.trim(),
        venmoHandle: venmoHandle.trim(),
        email: currentUser.email,
      });
      setCurrentUser({
        ...currentUser,
        displayName: displayName.trim(),
        venmoHandle: venmoHandle.trim() || undefined,
      });
      Alert.alert("Saved", "Profile updated.");
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    await signOut(auth);
    resetStore();
  }

  const avatarText = useMemo(() => initialsFromName(displayName || currentUser?.displayName || ""), [displayName, currentUser?.displayName]);

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
          <Text style={styles.name}>{displayName || currentUser?.displayName || "User"}</Text>
          <Text style={styles.email}>{currentUser?.email ?? ""}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              editable={!loading}
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Venmo Handle</Text>
            <TextInput
              value={venmoHandle}
              onChangeText={setVenmoHandle}
              placeholder="@yourhandle"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              style={styles.input}
              editable={!loading}
            />
          </View>
          <Pressable style={styles.saveButton} onPress={onSave} disabled={saving || loading}>
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Profile"}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
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
    fontSize: 32,
    fontWeight: "800",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
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
    paddingBottom: 14,
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
  fieldWrap: {
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  fieldLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    color: "#111827",
    backgroundColor: "white",
  },
  saveButton: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: theme.colors.primary,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "800",
  },
  logoutButton: {
    marginTop: 12,
    marginHorizontal: 16,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "800",
  },
});
