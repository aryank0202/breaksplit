import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { theme } from "../theme";
import Card from "../components/Card";
import Pill from "../components/Pill";
import Row from "../components/Row";

type Expense = {
  id: string;
  title: string;
  subtitle: string; // e.g., "Paid by Mike • Day 2"
  amount: string;
  status: "unpaid" | "collecting" | "settled";
};

const mockExpenses: Expense[] = [
  {
    id: "1",
    title: "Uber to South Beach",
    subtitle: "Paid by Mike • Day 1",
    amount: "$28.50",
    status: "collecting",
  },
  {
    id: "2",
    title: "Dinner at Ocean Drive",
    subtitle: "Paid by Sarah • Day 1",
    amount: "$142.10",
    status: "unpaid",
  },
  {
    id: "3",
    title: "Groceries",
    subtitle: "Paid by Aryan • Day 2",
    amount: "$64.22",
    status: "settled",
  },
];

function statusToPill(status: Expense["status"]) {
  if (status === "settled") return { label: "Settled", tone: "success" as const };
  if (status === "collecting") return { label: "Collecting", tone: "info" as const };
  return { label: "Unpaid", tone: "danger" as const };
}

export default function ExpensesScreen({ navigation }: any) {
  const youOwe = "$42.18";
  const youreOwed = "$87.50";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: theme.colors.text }}>
                Expenses
              </Text>

              <Pressable
                onPress={() => navigation.navigate("AddExpense")}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ color: "white", fontWeight: "800" }}>+ Add</Text>
              </Pressable>
            </Row>

            <Row style={{ gap: 12 }}>
              <Card style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "700" }}>You Owe</Text>
                <Text style={{ marginTop: 6, color: theme.colors.danger, fontSize: 20, fontWeight: "900" }}>
                  {youOwe}
                </Text>
              </Card>

              <Card style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.muted, fontWeight: "700" }}>You're Owed</Text>
                <Text style={{ marginTop: 6, color: theme.colors.success, fontSize: 20, fontWeight: "900" }}>
                  {youreOwed}
                </Text>
              </Card>
            </Row>

            <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "900", color: theme.colors.text }}>
              All Expenses
            </Text>
          </View>
        }
        data={mockExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const pill = statusToPill(item.status);

          return (
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => ({
                marginTop: 12,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Card>
                <Row style={{ justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
                      {item.title}
                    </Text>
                    <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "600" }}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 8 }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                      {item.amount}
                    </Text>
                    <Pill label={pill.label} tone={pill.tone} />
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}