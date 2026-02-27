import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Feather } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../components/Avatar";
import Card from "../components/Card";
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

const mockActivity: ActivityItem[] = [
  {
    id: "1",
    initials: "S",
    color: "#A855F7",
    title: "Sarah added Dinner at Ocean Drive",
    subtitle: "2h ago",
  },
  {
    id: "2",
    initials: "M",
    color: "#3B82F6",
    title: "Mike paid for Uber to South Beach",
    subtitle: "5h ago",
    amount: "$28.50",
  },
  {
    id: "3",
    initials: "E",
    color: "#EC4899",
    title: "Emma updated Day 3 itinerary",
    subtitle: "1d ago",
  },
];

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
  const youOwe = "$42.18";
  const youreOwed = "$87.50";

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
        data={mockActivity}
        keyExtractor={(item) => item.id}
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
