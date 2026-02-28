import React, { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
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

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

export default function CreateTripScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [tripName, setTripName] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [tripDurationDays, setTripDurationDays] = useState("");
  const [tripLocation, setTripLocation] = useState("");

  const canCreate = useMemo(
    () =>
      tripName.trim().length > 0 &&
      peopleCount.trim().length > 0 &&
      tripDurationDays.trim().length > 0 &&
      tripLocation.trim().length > 0,
    [tripDurationDays, peopleCount, tripName, tripLocation]
  );

  function onCreateTrip() {
    if (!canCreate) return;

    const membersCount = parseInt(peopleCount, 10);
    const durationDays = parseInt(tripDurationDays, 10);
    if (!Number.isInteger(membersCount) || membersCount <= 0) return;
    if (!Number.isInteger(durationDays) || durationDays <= 0) return;

    const headerPalette = ["#1290F6", "#FF5B00", "#00C060", "#F43F5E", "#7C3AED"];
    const newTrip = {
      id: `trip_${Date.now()}`,
      title: tripName.trim(),
      location: tripLocation.trim(),
      dates: `${durationDays} day${durationDays === 1 ? "" : "s"}`,
      members: `${membersCount} member${membersCount === 1 ? "" : "s"}`,
      youOwe: "$0.00",
      youreOwed: "$0.00",
      headerColor: headerPalette[Date.now() % headerPalette.length],
      oweColor: "#94A3B8",
      owedColor: "#94A3B8",
    };

    navigation.navigate("TripHome", { newTrip });
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={theme.colors.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>Create Trip</Text>

        <View style={styles.profileIcon}>
          <Feather name="user" size={17} color={theme.colors.muted} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.helperCard}>
            <Text style={styles.helperText}>
              Create your trip and invite friends to start planning together.
              You'll be able to manage the itinerary and split expenses.
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
            <Text style ={styles.fieldBlock}>Trip Location</Text>
            <View style={styles.inputWrap}>
              <Feather name="map-pin" size={18} color = "#94A3B8" />
              <TextInput
                value = {tripLocation}
                onChangeText={setTripLocation}
                placeholder="e.g, Miami, Fl"
                placeholderTextColor="#9CA3AF"
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
            <Text style={styles.subText}>You can invite more people later</Text>
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
            <Text style={styles.subText}>This will create a day-by-day itinerary</Text>
          </View>

          <Pressable
            onPress={onCreateTrip}
            disabled={!canCreate}
            style={[styles.createButton, !canCreate ? styles.createButtonDisabled : null]}
          >
            <Text style={[styles.createButtonText, !canCreate ? styles.createButtonTextDisabled : null]}>
              Create Trip
            </Text>
          </Pressable>

          <Text style={styles.footerHint}>
            After creating, you'll get an invite code to share with friends
          </Text>
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
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    color: "#111827",
    fontSize: 33,
    fontWeight: "800",
  },
  profileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
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
  subText: {
    color: "#475569",
    fontSize: 12,
  },
  createButton: {
    marginTop: 24,
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
  footerHint: {
    marginTop: 16,
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
});
