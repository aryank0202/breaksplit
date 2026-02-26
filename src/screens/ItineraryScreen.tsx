import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import { theme } from "../theme";

type ActivityItem = {
  id: string;
  initials: string;
  color: string;
  title: string;
  subtitle: string;
  amount?: string;
};

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

export default function DashboardScreen({ navigation }: any) {
  const youOwe = "$42.18";
  const youreOwed = "$87.50";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text }}>
                Miami Spring Break
              </Text>
              <Text style={{ marginTop: 6, color: theme.colors.muted }}>
                March 8–15, 2026
              </Text>
            </View>

            <Card style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ gap: 6 }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>You Owe</Text>
                <Text style={{ color: theme.colors.danger, fontSize: 22, fontWeight: "800" }}>
                  {youOwe}
                </Text>
              </View>

              <View style={{ gap: 6, alignItems: "flex-end" }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>You're Owed</Text>
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

            <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 8 }}>
              Recent Activity
            </Text>
          </View>
        }
        data={mockActivity}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ marginTop: 12 }}>
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