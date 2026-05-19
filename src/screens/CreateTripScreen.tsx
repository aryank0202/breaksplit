import React, { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { addUserTrip } from "../api/users";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTripDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTripDateRange(startDate: Date | null, endDate: Date | null) {
  if (startDate && endDate) return `${formatTripDate(startDate)} - ${formatTripDate(endDate)}`;
  if (startDate) return `${formatTripDate(startDate)} - Select end date`;
  return "Select first and last day";
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
  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
  const [tripEndDate, setTripEndDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeTripDateField, setActiveTripDateField] = useState<"start" | "end">("start");
  const [peopleCount, setPeopleCount] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const tripDateText = formatTripDateRange(tripStartDate, tripEndDate);

  const canCreate = useMemo(
    () => tripName.trim().length > 0 && !!tripStartDate && !!tripEndDate && peopleCount.trim().length > 0,
    [peopleCount, tripEndDate, tripName, tripStartDate]
  );

  async function applySelectedTrip(tripId: string) {
    const trip = await getTrip(tripId);
    if (!trip) {
      throw new Error("Joined trip, but could not load trip details.");
    }
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
    if (!tripStartDate || !tripEndDate) {
      Alert.alert("Dates needed", "Select the first and last day of your trip.");
      return;
    }
    if (tripEndDate < tripStartDate) {
      Alert.alert("Invalid dates", "The last day of the trip must be after the first day.");
      return;
    }
    const members = parseInt(peopleCount, 10);
    if (!Number.isInteger(members) || members <= 0) {
      Alert.alert("Invalid members", "Number of people must be a positive whole number.");
      return;
    }

    try {
      setLoadingCreate(true);
      const startDate = toIsoDate(tripStartDate);
      const endDate = toIsoDate(tripEndDate);
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
        try {
          await addUserTrip(currentUser.uid, tripId);
        } catch {
          // Non-blocking: trip creation should still succeed even if user metadata write fails.
        }
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
    const normalizedInviteCode = inviteCode.replace(/\s+/g, "").toUpperCase();
    if (!normalizedInviteCode) {
      Alert.alert("Invite code needed", "Enter an invite code.");
      return;
    }
    try {
      setLoadingJoin(true);
      const { tripId } = await withTimeout(joinTripByInviteCode(normalizedInviteCode), 20000);
      if (currentUser?.uid) {
        try {
          await addUserTrip(currentUser.uid, tripId);
        } catch {
          // Non-blocking: membership write succeeded, so proceed even if metadata write fails.
        }
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
            <Text style={styles.fieldLabel}>Trip Dates</Text>
            <Pressable
              style={styles.inputWrap}
              onPress={() => {
                setActiveTripDateField(tripStartDate && !tripEndDate ? "end" : "start");
                setShowDateModal(true);
              }}
            >
              <Feather name="calendar" size={18} color="#94A3B8" />
              <Text style={[styles.inputText, !tripStartDate || !tripEndDate ? styles.placeholderText : null]}>
                {tripDateText}
              </Text>
              <Feather name="chevron-down" size={18} color="#94A3B8" />
            </Pressable>
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

      <Modal visible={showDateModal} transparent animationType="slide" onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.dateSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Trip Dates</Text>
              <Pressable onPress={() => setShowDateModal(false)} style={styles.closeCircle}>
                <Feather name="x" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.dateChoiceRow}>
              <Pressable
                onPress={() => setActiveTripDateField("start")}
                style={[
                  styles.dateChoice,
                  activeTripDateField === "start" ? styles.dateChoiceActive : null,
                ]}
              >
                <Text style={styles.dateChoiceLabel}>First Day</Text>
                <Text style={[styles.dateChoiceValue, !tripStartDate ? styles.placeholderText : null]}>
                  {tripStartDate ? formatTripDate(tripStartDate) : "Select date"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTripDateField("end")}
                style={[
                  styles.dateChoice,
                  activeTripDateField === "end" ? styles.dateChoiceActive : null,
                ]}
              >
                <Text style={styles.dateChoiceLabel}>Last Day</Text>
                <Text style={[styles.dateChoiceValue, !tripEndDate ? styles.placeholderText : null]}>
                  {tripEndDate ? formatTripDate(tripEndDate) : "Select date"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={
                  activeTripDateField === "start"
                    ? tripStartDate ?? new Date()
                    : tripEndDate ?? tripStartDate ?? new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "calendar"}
                textColor="#111827"
                themeVariant="light"
                minimumDate={activeTripDateField === "end" ? tripStartDate ?? undefined : undefined}
                onChange={(event, selected) => {
                  if (Platform.OS === "android" && event.type === "dismissed") return;
                  if (!selected) return;

                  if (activeTripDateField === "start") {
                    setTripStartDate(selected);
                    if (tripEndDate && tripEndDate < selected) setTripEndDate(null);
                    setActiveTripDateField("end");
                  } else {
                    setTripEndDate(selected);
                  }
                }}
              />
            </View>

            <View style={styles.dateActions}>
              <Pressable
                onPress={() => {
                  setTripStartDate(null);
                  setTripEndDate(null);
                  setActiveTripDateField("start");
                }}
                style={styles.secondaryDateButton}
              >
                <Text style={styles.secondaryDateButtonText}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDateModal(false)}
                disabled={!tripStartDate || !tripEndDate}
                style={[
                  styles.primaryDateButton,
                  !tripStartDate || !tripEndDate ? styles.primaryDateButtonDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.primaryDateButtonText,
                    !tripStartDate || !tripEndDate ? styles.primaryDateButtonTextDisabled : null,
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  inputText: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
  },
  placeholderText: {
    color: "#9CA3AF",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
    justifyContent: "flex-end",
  },
  dateSheet: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: "#1F2937",
    fontSize: 30,
    fontWeight: "800",
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  dateChoiceRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateChoice: {
    flex: 1,
    minHeight: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    gap: 5,
  },
  dateChoiceActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#EFF6FF",
  },
  dateChoiceLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dateChoiceValue: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  pickerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    overflow: "hidden",
  },
  dateActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryDateButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryDateButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "800",
  },
  primaryDateButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryDateButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  primaryDateButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  primaryDateButtonTextDisabled: {
    color: "#94A3B8",
  },
});
