import React, { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteUser, updateEmail, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { useTrip } from "../state/TripStore";
import { deleteUserProfileDoc, upsertUserProfile } from "../api/users";
import { theme } from "../theme";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser, resetStore } = useTrip();
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL ?? "");
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [localPhotoBase64, setLocalPhotoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const avatarText = useMemo(() => initialsFromName(displayName || currentUser?.displayName || "User"), [displayName, currentUser?.displayName]);
  const avatarUri = localPhotoUri ?? photoURL;

  async function onPickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo library access to choose a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || result.assets.length === 0) return;
    setLocalPhotoUri(result.assets[0].uri);
    setLocalPhotoBase64(result.assets[0].base64 ?? null);
  }

  async function onSave() {
    if (!currentUser?.uid || !auth.currentUser) return;
    const nextName = displayName.trim();
    const nextEmail = email.trim();

    if (!nextName) {
      Alert.alert("Name required", "Please enter your display name.");
      return;
    }
    if (!isValidEmail(nextEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      let nextPhotoURL = photoURL;
      if (localPhotoUri) {
        const pickedBase64 =
          localPhotoBase64 ??
          (await FileSystem.readAsStringAsync(localPhotoUri, { encoding: FileSystem.EncodingType.Base64 }));
        nextPhotoURL = `data:image/jpeg;base64,${pickedBase64}`;
        setPhotoURL(nextPhotoURL);
      }

      if (auth.currentUser.email !== nextEmail) {
        await updateEmail(auth.currentUser, nextEmail);
      }

      const authPhotoURL = nextPhotoURL.startsWith("data:") ? auth.currentUser.photoURL ?? null : nextPhotoURL || null;
      await updateProfile(auth.currentUser, {
        displayName: nextName,
        photoURL: authPhotoURL,
      });

      await upsertUserProfile(currentUser.uid, {
        displayName: nextName,
        email: nextEmail,
        photoURL: nextPhotoURL || undefined,
      });

      setCurrentUser({
        ...currentUser,
        displayName: nextName,
        email: nextEmail,
        photoURL: nextPhotoURL || undefined,
      });

      Alert.alert("Saved", "Profile updated successfully.");
      navigation.goBack();
    } catch (error: any) {
      if (String(error?.code).includes("requires-recent-login")) {
        Alert.alert("Re-authentication required", "For security, please log out and log in again before changing email or deleting your account.");
      } else {
        Alert.alert("Save failed", error?.message ?? "Could not update profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  function onDeleteAccountConfirm() {
    Alert.alert(
      "Delete account?",
      "This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void onDeleteAccount() },
      ]
    );
  }

  async function onDeleteAccount() {
    if (!auth.currentUser || !currentUser?.uid) return;
    setDeleting(true);
    const uid = currentUser.uid;
    try {
      await deleteUser(auth.currentUser);
      await deleteUserProfileDoc(uid);
      resetStore();
    } catch (error: any) {
      if (String(error?.code).includes("requires-recent-login")) {
        Alert.alert("Re-authentication required", "For security, please log out and log in again before deleting your account.");
      } else {
        Alert.alert("Delete failed", error?.message ?? "Could not delete your account.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarCard}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarText}</Text>
            </View>
          )}
          <Pressable onPress={onPickPhoto} disabled={saving || deleting}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={16} color="#94A3B8" />
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                editable={!saving && !deleting}
              />
            </View>
            <Text style={styles.helperText}>This is how your name appears to other members</Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                editable={!saving && !deleting}
              />
            </View>
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={onSave} disabled={saving || deleting}>
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>

        <View style={styles.sectionCard}>
          <Text style={styles.dangerTitle}>DANGER ZONE</Text>
          <Pressable style={styles.deleteButton} onPress={onDeleteAccountConfirm} disabled={saving || deleting}>
            <Feather name="trash-2" size={18} color="#DC2626" />
            <Text style={styles.deleteText}>{deleting ? "Deleting..." : "Delete Account"}</Text>
          </Pressable>
          <Text style={styles.dangerHelp}>This action cannot be undone</Text>
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
    gap: 16,
    paddingBottom: 28,
  },
  avatarCard: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    paddingVertical: 18,
    gap: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarText: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
  },
  changePhotoText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
  },
  sectionCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
    paddingBottom: 16,
  },
  sectionTitle: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  fieldWrap: {
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  fieldLabel: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 17,
  },
  helperText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  saveButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  dangerTitle: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  deleteText: {
    color: "#DC2626",
    fontSize: 20,
    fontWeight: "800",
  },
  dangerHelp: {
    marginTop: 12,
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
});
