import React, { useMemo } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Feather } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../components/Avatar";
import Card from "../components/Card";
import { centsToDollars, useTrip } from "../state/TripStore";
import ExpensesScreen from "./ExpensesScreen";
import MembersScreen from "./MembersScreen";
import { theme } from "../theme";

type ActivityItem = {
  id: string;
  initials: string;
  color: string;
  title: string;
  subtitle: string;
  amount?: string;
};

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

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.radius.button,
        alignItems: "center",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function OutlineButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: "white",
        paddingVertical: 16,
        borderRadius: theme.radius.button,
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={{ fontWeight: "700", fontSize: 16, color: theme.colors.primary }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ItineraryTabContent({ navigation }: any) {
  const { state } = useTrip();

  function sum(nums: number[]) {
    return nums.reduce((a, b) => a + b, 0);
  }

  const youOweCents = sum(
    state.splits
      .filter((s) => s.memberId === "me" && !s.paid)
      .map((s) => s.owedCents)
  );

  const youreOwedCents = sum(
    state.splits
      .filter((s) => s.memberId !== "me" && !s.paid)
      .filter((s) => {
        const exp = state.expenses.find((e) => e.id === s.expenseId);
        return exp?.paidById === "me";
      })
      .map((s) => s.owedCents)
  );

  const youOwe = centsToDollars(youOweCents);
  const youreOwed = centsToDollars(youreOwedCents);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const expenseActivity: (ActivityItem & { createdAt: number })[] = state.expenses.map((expense) => {
      const actor = state.members.find((m) => m.id === expense.paidById);
      const actorName = actor?.id === "me" ? "You" : actor?.name ?? "Someone";
      return {
        id: `expense_${expense.id}`,
        initials: actor?.initials ?? "??",
        color: actor?.color ?? "#94A3B8",
        title: `${actorName} added expense ${expense.title}`,
        subtitle: timeAgo(expense.createdAt),
        amount: centsToDollars(expense.totalCents),
        createdAt: expense.createdAt,
      };
    });

    const itineraryActivity: (ActivityItem & { createdAt: number })[] = state.itinerary.map((item) => ({
      id: `itinerary_${item.id}`,
      initials: "ME",
      color: "#3B82F6",
      title: `You added itinerary item ${item.title}`,
      subtitle: timeAgo(item.createdAt),
      createdAt: item.createdAt,
    }));

    return [...expenseActivity, ...itineraryActivity]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 12)
      .map(({ createdAt, ...activity }) => activity);
  }, [state.expenses, state.itinerary, state.members]);

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.mainContent}>
            <Card style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ gap: 6 }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>You Owe</Text>
                <Text style={{ color: "#EF4444", fontSize: 22, fontWeight: "800" }}>
                  {youOwe}
                </Text>
              </View>

              <View style={{ gap: 6, alignItems: "flex-end" }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>
                  You're Owed
                </Text>
                <Text style={{ color: theme.colors.success, fontSize: 22, fontWeight: "800" }}>
                  {youreOwed}
                </Text>
              </View>
            </Card>

            <PrimaryButton
              label="Add Expense"
              onPress={() => navigation.navigate("AddExpense")}
            />

            <OutlineButton
              label="Add Itinerary Item"
              onPress={() => navigation.navigate("ItineraryDay")}
            />

            <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 8, color: "#111827" }}>
              Recent Activity
            </Text>
          </View>
        }
        data={recentActivity}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ marginHorizontal: 20, marginTop: 8, color: theme.colors.muted }}>
            No activity yet.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={{ marginTop: 12, marginHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar initials={item.initials} bgColor={item.color} />

              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: theme.colors.text }}>
                  {item.title}
                </Text>
                <Text style={{ color: theme.colors.muted, marginTop: 2 }}>
                  {item.subtitle}
                </Text>
              </View>

              {item.amount ? (
                <Text style={{ fontWeight: "800", color: theme.colors.text }}>
                  {item.amount}
                </Text>
              ) : null}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

export default function ItineraryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.topSection, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={theme.colors.primary} />
          </Pressable>
          <Text style={styles.title}>Miami Spring Break</Text>
        </View>

        <View style={styles.dateRow}>
          <Feather name="calendar" size={16} color="#475569" />
          <Text style={styles.dateText}>March 8-15, 2026</Text>
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
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    paddingBottom: 20,
  },
  mainContent: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 16,
  },
  topSection: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginLeft: 36,
    marginBottom: 10,
  },
  dateText: {
    color: "#334155",
    fontSize: 17,
  },
  tabBar: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIndicator: {
    backgroundColor: theme.colors.primary,
    height: 2,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "none",
  },
});
