import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

type Trip = {
  id: string;
  title: string;
  location: string;
  dates: string;
  members: string;
  youOwe: string;
  youreOwed: string;
  headerColor: string;
  oweColor: string;
  owedColor: string;
};

const initialTrips: Trip[] = [
  {
    id: "1",
    title: "Miami Spring Break",
    location: "Miami, FL",
    dates: "Mar 8-15, 2026",
    members: "6 members",
    youOwe: "$42.18",
    youreOwed: "$87.50",
    headerColor: "#1290F6",
    oweColor: "#FF2A2A",
    owedColor: "#00A63E",
  },
  {
    id: "2",
    title: "Cabo Beach Week",
    location: "Cabo San Lucas, MX",
    dates: "Apr 2-9, 2026",
    members: "8 members",
    youOwe: "$0.00",
    youreOwed: "$125.00",
    headerColor: "#FF5B00",
    oweColor: "#94A3B8",
    owedColor: "#00A63E",
  },
  {
    id: "3",
    title: "Lake Tahoe Weekend",
    location: "Lake Tahoe, CA",
    dates: "May 15-18, 2026",
    members: "4 members",
    youOwe: "$75.00",
    youreOwed: "$0.00",
    headerColor: "#00C060",
    oweColor: "#FF2A2A",
    owedColor: "#94A3B8",
  },
];

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.cardHeader, { backgroundColor: trip.headerColor }]}>
        <Text style={styles.tripTitle}>{trip.title}</Text>
        <View style={styles.infoWithIcon}>
          <Feather name="map-pin" size={13} color="white" />
          <Text style={styles.tripLocation}>{trip.location}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <View style={styles.infoWithIcon}>
            <Feather name="calendar" size={13} color="#334155" />
            <Text style={styles.metaText}>{trip.dates}</Text>
          </View>
          <View style={styles.infoWithIcon}>
            <Feather name="users" size={13} color="#334155" />
            <Text style={styles.metaText}>{trip.members}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>You Owe</Text>
            <Text style={[styles.balanceValue, { color: trip.oweColor }]}>{trip.youOwe}</Text>
          </View>
          <View>
            <Text style={styles.balanceLabel}>You're Owed</Text>
            <Text style={[styles.balanceValue, { color: trip.owedColor }]}>{trip.youreOwed}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function TripHomeScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);

  useEffect(() => {
    const incomingTrip: Trip | undefined = route?.params?.newTrip;
    if (!incomingTrip) return;

    setTrips((prev) => {
      if (prev.some((trip) => trip.id === incomingTrip.id)) return prev;
      return [incomingTrip, ...prev];
    });

    navigation.setParams({ newTrip: undefined });
  }, [navigation, route?.params?.newTrip]);

  return (
    <View style={styles.screen}>
      <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>My Trips</Text>
          <Text style={styles.headerSub}>{trips.length} active trips</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Profile")} style={styles.profileIcon}>
          <Feather name="user" size={18} color={theme.colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.createButton} onPress={() => navigation.navigate("CreateTrip")}>
          <Text style={styles.createButtonText}>+ Create New Trip</Text>
        </Pressable>

        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onPress={() => navigation.navigate("Itinerary")}
          />
        ))}
      </ScrollView>
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
    gap: 16,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 9,
  },
  tripTitle: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  tripLocation: {
    color: "white",
    opacity: 0.95,
    fontSize: 12,
    fontWeight: "500",
  },
  infoWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  metaText: {
    color: "#334155",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  balanceRow: {
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
});
