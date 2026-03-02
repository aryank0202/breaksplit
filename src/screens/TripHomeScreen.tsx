import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import { useTrip } from "../state/TripStore";
import { computeTotals } from "../api/expenses";
import { listMembers, listMyTrips, deleteTrip} from "../api/trips";
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
  const { setSelectedTripId, selectedTrip, setSelectedTrip, currentUser } = useTrip();
  const [loading, setLoading] = useState(true);
  const [tripCards, setTripCards] = useState<
    Array<{
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      timezone: string;
      memberCount: number;
      youOweCents: number;
      youreOwedCents: number;
    }>
  >([]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setTripCards([]);
      setLoading(false);
      return;
    }
    const uid = currentUser.uid;

    async function load() {
      try {
        setLoading(true);
        const trips = await listMyTrips(uid);
        const cards = await Promise.all(
          trips.map(async (trip) => {
            try {
              const [members, totals] = await Promise.all([
                listMembers(trip.id),
                computeTotals(trip.id, uid),
              ]);
              return {
                id: trip.id,
                name: trip.name,
                startDate: trip.startDate,
                endDate: trip.endDate,
                timezone: trip.timezone,
                memberCount: members.length,
                youOweCents: totals.youOweCents,
                youreOwedCents: totals.youreOwedCents,
              };
            } catch {
              return null;
            }
          })
        );
        setTripCards(cards.filter((card): card is Exclude<(typeof cards)[number], null> => Boolean(card)));
      } catch (error: any) {
        Alert.alert("Load failed", error?.message ?? "Could not load trip.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [currentUser?.uid]);


  const selectedDateText = useMemo(() => {
    if (!selectedTrip) return "";
    return formatDateRange(selectedTrip.startDate, selectedTrip.endDate);
  }, [selectedTrip]);

  function onOpenTrip(card: (typeof tripCards)[number]) {
    setSelectedTripId(card.id);
    setSelectedTrip({
      id: card.id,
      name: card.name,
      startDate: card.startDate,
      endDate: card.endDate,
      timezone: card.timezone,
    });
    navigation.navigate("Itinerary");
  }

  async function onDeleteTrip(cardId: string, tripName: string) {
  Alert.alert(
    "Delete Trip",
    `Are you sure you want to delete "${tripName}"? This cannot be undone.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTrip(cardId);
            setTripCards((prev) => prev.filter((t) => t.id !== cardId));
          } catch (error: any) {
            Alert.alert("Delete failed", error?.message ?? "Could not delete trip.");
          }
        },
      },
    ]
  );
}

  return (
    <View style={styles.screen}>
      <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>My Trips</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Profile")} style={styles.profileIcon}>
          <Feather name="user" size={18} color={theme.colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("CreateTrip")}>
          <Text style={styles.secondaryButtonText}> + Create / Join Another Trip</Text>
        </Pressable>

        {loading ? <Text style={styles.loadingText}>Loading...</Text> : null}

        {!loading && tripCards.length === 0 ? (
          <Text style={styles.loadingText}>Create your first trip to get started.</Text>
        ) : null}

        {tripCards.map((card) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Pressable onPress={() => onOpenTrip(card)} style={{ flex: 1 }}>
                <Text style={styles.tripTitle}>{card.name}</Text>
              </Pressable>

              <Pressable
                onPress={() => onDeleteTrip(card.id, card.name)}
                hitSlop={10}
                style={styles.deleteIcon}
              >
                <Feather name="trash-2" size={16} color="#DC2626" />
              </Pressable>
            </View>
            <Text style={styles.metaText}>
              {selectedTrip?.id === card.id ? selectedDateText : formatDateRange(card.startDate, card.endDate)}
            </Text>
            <Text style={styles.metaText}>{card.memberCount} members</Text>
            <View style={styles.divider} />
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>You Owe</Text>
                <Text style={[styles.balanceValue, { color: toneFromAmount(card.youOweCents) }]}>
                  {formatCents(card.youOweCents)}
                </Text>
              </View>
              <View>
                <Text style={styles.balanceLabel}>You're Owed</Text>
                <Text style={[styles.balanceValue, { color: card.youreOwedCents > 0 ? "#16A34A" : "#94A3B8" }]}>
                  {formatCents(card.youreOwedCents)}
                </Text>
              </View>
            </View>
          </View>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deleteIcon: {
    padding: 6,
    borderRadius: 8,
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
