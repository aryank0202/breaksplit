import React, { useEffect, useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Feather } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import ExpensesScreen from "./ExpensesScreen";
import MembersScreen from "./MembersScreen";
import { theme } from "../theme";
import { useTrip } from "../state/TripStore";
import { computeTotals, listExpenses } from "../api/expenses";
import { formatCents } from "../utils/money";
import { listRecentItineraryItems } from "../api/itinerary";

const Tab = createMaterialTopTabNavigator();

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

function ItineraryTabContent({ navigation }: any) {
  const { selectedTripId, selectedTrip, currentUser } = useTrip();
  const [youOwe, setYouOwe] = useState("$0.00");
  const [youreOwed, setYoureOwed] = useState("$0.00");
  const [activity, setActivity] = useState<Array<{ id: string; initials: string; color: string; title: string; subtitle: string; amount?: string }>>([]);

  useEffect(() => {
    async function load() {
      if (!selectedTripId || !selectedTrip || !currentUser) return;
      const [totals, expenses, itinerary] = await Promise.all([
        computeTotals(selectedTripId, currentUser.uid),
        listExpenses(selectedTripId),
        listRecentItineraryItems(selectedTripId, selectedTrip.startDate, selectedTrip.endDate, 8),
      ]);
      setYouOwe(formatCents(totals.youOweCents));
      setYoureOwed(formatCents(totals.youreOwedCents));

      const expenseRows = expenses.slice(0, 5).map((expense) => ({
        id: `expense_${expense.id}`,
        initials: "EX",
        color: "#3B82F6",
        title: `Expense: ${expense.title}`,
        subtitle: timeAgo(expense.createdAtMs),
        amount: formatCents(expense.amountCents),
        createdAtMs: expense.createdAtMs,
      }));
      const itineraryRows = itinerary.map((item) => ({
        id: `itinerary_${item.id}`,
        initials: "IT",
        color: "#14B8A6",
        title: `Itinerary: ${item.title}`,
        subtitle: `${item.dayId} • ${timeAgo(item.createdAtMs)}`,
        createdAtMs: item.createdAtMs,
      }));
      setActivity(
        [...expenseRows, ...itineraryRows]
          .sort((a, b) => b.createdAtMs - a.createdAtMs)
          .map(({ createdAtMs, ...row }) => row)
      );
    }
    void load();
  }, [currentUser, selectedTrip, selectedTripId]);

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.mainContent}>
            <Card style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ gap: 6 }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>You Owe</Text>
                <Text style={{ color: "#EF4444", fontSize: 22, fontWeight: "800" }}>{youOwe}</Text>
              </View>
              <View style={{ gap: 6, alignItems: "flex-end" }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>You're Owed</Text>
                <Text style={{ color: theme.colors.success, fontSize: 22, fontWeight: "800" }}>{youreOwed}</Text>
              </View>
            </Card>

            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("AddExpense")}>
              <Text style={styles.primaryButtonText}>Add Expense</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("ItineraryDay")}>
              <Text style={styles.secondaryButtonText}>Add Itinerary Item</Text>
            </Pressable>

            <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 8, color: "#111827" }}>Recent Activity</Text>
          </View>
        }
        data={activity}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ marginHorizontal: 20, marginTop: 8, color: theme.colors.muted }}>No activity yet.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginTop: 12, marginHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar initials={item.initials} bgColor={item.color} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: theme.colors.text }}>{item.title}</Text>
                <Text style={{ color: theme.colors.muted, marginTop: 2 }}>{item.subtitle}</Text>
              </View>
              {item.amount ? <Text style={{ fontWeight: "800", color: theme.colors.text }}>{item.amount}</Text> : null}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

export default function ItineraryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { selectedTrip } = useTrip();
  const start = selectedTrip?.startDate ? new Date(`${selectedTrip.startDate}T00:00:00`) : null;
  const end = selectedTrip?.endDate ? new Date(`${selectedTrip.endDate}T00:00:00`) : null;
  const dateText =
    start && end
      ? `${start.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString(
          undefined,
          { month: "long", day: "numeric", year: "numeric" }
        )}`
      : "";

  return (
    <View style={styles.screen}>
      <View style={[styles.topSection, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={theme.colors.primary} />
          </Pressable>
          <Text style={styles.title}>{selectedTrip?.name ?? "Trip"}</Text>
        </View>
        <View style={styles.dateRow}>
          <Feather name="calendar" size={16} color="#475569" />
          <Text style={styles.dateText}>{dateText}</Text>
        </View>
      </View>

      <Tab.Navigator
        initialRouteName="Itinerary"
        screenOptions={{
          swipeEnabled: true,
          tabBarStyle: styles.tabBar,
          tabBarIndicatorStyle: styles.tabIndicator,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: "#64748B",
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen name="Itinerary" component={ItineraryTabContent} />
        <Tab.Screen name="Expenses" component={ExpensesScreen} />
        <Tab.Screen name="Members" component={MembersScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { paddingBottom: 20 },
  mainContent: { paddingHorizontal: 20, gap: 16, marginTop: 16 },
  topSection: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: { fontSize: 21, fontWeight: "800", color: "#0F172A" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginLeft: 36, marginBottom: 10 },
  dateText: { color: "#334155", fontSize: 14 },
  tabBar: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIndicator: { backgroundColor: theme.colors.primary, height: 2 },
  tabLabel: { fontSize: 16, fontWeight: "700", textTransform: "none" },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.button,
    alignItems: "center",
  },
  primaryButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
  secondaryButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: theme.radius.button,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: { fontWeight: "700", fontSize: 16, color: theme.colors.primary },
});
