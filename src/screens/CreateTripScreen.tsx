import React, { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import { createTrip, getTrip, joinTripByInviteCode } from "../api/trips";
import { useTrip } from "../state/TripStore";
import { setUserLastTrip } from "../api/users";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function plusDays(start: Date, days: number) {
  const date = new Date(start);
  date.setDate(date.getDate() + days);
  return date;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 20000) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Request timed out. Check your connection/rules.")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function CreateTripScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { currentUser, setSelectedTripId, setSelectedTrip } = useTrip();
  const [tripName, setTripName] = useState("");
  const [tripDurationDays, setTripDurationDays] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

  const canCreate = useMemo(
    () => tripName.trim().length > 0 && tripDurationDays.trim().length > 0 && peopleCount.trim().length > 0,
    [peopleCount, tripDurationDays, tripName]
  );

  async function applySelectedTrip(tripId: string) {
    const trip = await getTrip(tripId);
    if (!trip) return;
    setSelectedTripId(tripId);
    setSelectedTrip({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      timezone: trip.timezone,
    });
    navigation.replace("TripHome");
  }

  async function onCreateTrip() {
    if (!canCreate) return;
    const durationDays = parseInt(tripDurationDays, 10);
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      Alert.alert("Invalid duration", "Trip duration must be a positive number.");
      return;
    }
    const members = parseInt(peopleCount, 10);
    if (!Number.isInteger(members) || members <= 0) {
      Alert.alert("Invalid members", "Number of people must be a positive whole number.");
      return;
    }

    try {
      setLoadingCreate(true);
      const start = new Date();
      const end = plusDays(start, durationDays - 1);
      const startDate = toIsoDate(start);
      const endDate = toIsoDate(end);
      const { tripId, inviteCode: code } = await withTimeout(
        createTrip({
          name: tripName.trim(),
          startDate,
          endDate,
          timezone: deviceTimezone,
        }),
        20000
      );
      if (currentUser?.uid) {
        await setUserLastTrip(currentUser.uid, tripId);
      }
      // Avoid a second Firestore read on create flow; we already have the needed trip payload.
      setSelectedTripId(tripId);
      setSelectedTrip({
        id: tripId,
        name: tripName.trim(),
        startDate,
        endDate,
        timezone: deviceTimezone,
      });
      navigation.replace("TripHome");
      Alert.alert("Trip created", `Invite code: ${code}`);
    } catch (error: any) {
      Alert.alert("Create trip failed", error?.message ?? "Unable to create trip.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function onJoinTrip() {
    if (!inviteCode.trim()) {
      Alert.alert("Invite code needed", "Enter an invite code.");
      return;
    }
    try {
      setLoadingJoin(true);
      const { tripId } = await withTimeout(joinTripByInviteCode(inviteCode), 20000);
      if (currentUser?.uid) {
        await setUserLastTrip(currentUser.uid, tripId);
      }
      await withTimeout(applySelectedTrip(tripId), 20000);
    } catch (error: any) {
      Alert.alert("Join failed", error?.message ?? "Unable to join trip.");
    } finally {
      setLoadingJoin(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.navigate("TripHome")} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Trip</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.helperCard}>
            <Text style={styles.helperText}>
              Create your trip and invite friends to start planning together.
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Trip Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="map-pin" size={18} color="#94A3B8" />
              <TextInput
                value={tripName}
                onChangeText={setTripName}
                placeholder="e.g., Miami Spring Break"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Trip Duration (Days)</Text>
            <View style={styles.inputWrap}>
              <Feather name="calendar" size={18} color="#94A3B8" />
              <TextInput
                value={tripDurationDays}
                onChangeText={(v) => setTripDurationDays(digitsOnly(v))}
                placeholder="How many days?"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Number of People</Text>
            <View style={styles.inputWrap}>
              <Feather name="users" size={18} color="#94A3B8" />
              <TextInput
                value={peopleCount}
                onChangeText={(v) => setPeopleCount(digitsOnly(v))}
                placeholder="How many people?"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          <Pressable
            onPress={onCreateTrip}
            disabled={!canCreate || loadingCreate}
            style={[styles.createButton, !canCreate ? styles.createButtonDisabled : null]}
          >
            <Text style={[styles.createButtonText, !canCreate ? styles.createButtonTextDisabled : null]}>
              {loadingCreate ? "Creating..." : "Create Trip"}
            </Text>
          </Pressable>

          <View style={styles.joinCard}>
            <Text style={styles.joinTitle}>Join via Invite Code</Text>
            <View style={styles.inputWrap}>
              <Feather name="hash" size={18} color="#94A3B8" />
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                placeholder="Enter code"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
            <Pressable onPress={onJoinTrip} style={styles.joinButton} disabled={loadingJoin}>
              <Text style={styles.joinButtonText}>{loadingJoin ? "Joining..." : "Join Trip"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    color: "#111827",
    fontSize: 33,
    fontWeight: "800",
  },
  body: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  helperCard: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  helperText: {
    color: "#1E3A8A",
    fontSize: 15,
    lineHeight: 22,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 16,
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
  },
  createButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  createButtonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  createButtonTextDisabled: {
    color: "#94A3B8",
  },
  joinCard: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 10,
  },
  joinTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  joinButton: {
    marginTop: 4,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  joinButtonText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 16,
  },
});
