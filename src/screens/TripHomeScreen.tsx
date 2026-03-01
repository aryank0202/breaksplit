import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import { useTrip } from "../state/TripStore";
import { computeTotals } from "../api/expenses";
import { getTrip, listMembers } from "../api/trips";
import { formatCents } from "../utils/money";

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function toneFromAmount(value: number) {
  if (value > 0) return "#EF4444";
  return "#94A3B8";
}

export default function TripHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { selectedTripId, selectedTrip, setSelectedTrip, currentUser } = useTrip();
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [youOweCents, setYouOweCents] = useState(0);
  const [youreOwedCents, setYoureOwedCents] = useState(0);

  useEffect(() => {
    if (!selectedTripId) {
      navigation.replace("CreateTrip");
      return;
    }
    const tripId = selectedTripId;
    async function load() {
      try {
        setLoading(true);
        const trip = await getTrip(tripId);
        if (!trip) {
          navigation.replace("CreateTrip");
          return;
        }
        setSelectedTrip({
          id: trip.id,
          name: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
          timezone: trip.timezone,
        });

        const members = await listMembers(tripId);

        setMemberCount(members.length);
        const adjustedTotals = await computeTotals(tripId, currentUser?.uid ?? trip.createdBy);
        setYouOweCents(adjustedTotals.youOweCents);
        setYoureOwedCents(adjustedTotals.youreOwedCents);
      } catch (error: any) {
        Alert.alert("Load failed", error?.message ?? "Could not load trip.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [currentUser?.uid, navigation, selectedTripId, setSelectedTrip]);

  const dateText = useMemo(() => {
    if (!selectedTrip) return "";
    return formatDateRange(selectedTrip.startDate, selectedTrip.endDate);
  }, [selectedTrip]);

  return (
    <View style={styles.screen}>
      <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>My Trips</Text>
          <Text style={styles.headerSub}>
            {selectedTrip ? `${selectedTrip.name}` : "No trip selected"}
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Profile")} style={styles.profileIcon}>
          <Feather name="user" size={18} color={theme.colors.muted} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("CreateTrip")}>
          <Text style={styles.secondaryButtonText}> + Create / Join Another Trip</Text>
        </Pressable>

        {loading ? <Text style={styles.loadingText}>Loading...</Text> : null}

        <Pressable style={styles.card} onPress={() => navigation.navigate("Itinerary")}>
          <Text style={styles.tripTitle}>{selectedTrip?.name ?? "Loading..."}</Text>
          <Text style={styles.metaText}>{dateText}</Text>
          <Text style={styles.metaText}>{memberCount} members</Text>
          <View style={styles.divider} />
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>You Owe</Text>
              <Text style={[styles.balanceValue, { color: toneFromAmount(youOweCents) }]}>
                {formatCents(youOweCents)}
              </Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>You're Owed</Text>
              <Text style={[styles.balanceValue, { color: youreOwedCents > 0 ? "#16A34A" : "#94A3B8" }]}>
                {formatCents(youreOwedCents)}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerWrap: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  headerSub: {
    color: theme.colors.muted,
    marginTop: 3,
    fontSize: 14,
  },
  profileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 8,
  },
  tripTitle: {
    color: "#0F172A",
    fontWeight: "900",
    fontSize: 20,
  },
  metaText: {
    color: "#334155",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 8,
  },
  balanceRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceLabel: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  balanceValue: {
    marginTop: 4,
    fontWeight: "800",
    fontSize: 17,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: {
    color: "#1E40AF",
    fontWeight: "800",
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
  },
});
