import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { theme } from "../theme";
import Card from "../components/Card";
import Pill from "../components/Pill";
import Row from "../components/Row";

type ExpenseRow =
  | {
      id: string;
      title: string;
      paidBy: string;
      date: string; // "Mar 9"
      total: string; // "$114.00"
      mode: "you_owe";
      yourShare: string; // "$28.50"
      status: "Unpaid" | "Paid";
    }
  | {
      id: string;
      title: string;
      paidBy: string;
      date: string;
      total: string;
      mode: "collecting";
      collecting: string; // "$87.50"
      status: "Collecting";
    };

const mockExpenses: ExpenseRow[] = [
  {
    id: "1",
    title: "Uber to South Beach",
    paidBy: "Mike Johnson",
    date: "Mar 9",
    total: "$114.00",
    mode: "you_owe",
    yourShare: "$28.50",
    status: "Unpaid",
  },
  {
    id: "2",
    title: "Dinner at Zuma",
    paidBy: "You",
    date: "Mar 9",
    total: "$350.00",
    mode: "collecting",
    collecting: "$87.50",
    status: "Collecting",
  },
  {
    id: "3",
    title: "Jet Ski Rental",
    paidBy: "Sarah Martinez",
    date: "Mar 9",
    total: "$240.00",
    mode: "you_owe",
    yourShare: "$40.00",
    status: "Paid",
  },
  {
    id: "4",
    title: "Breakfast at Front Porch",
    paidBy: "Emma Kim",
    date: "Mar 8",
    total: "$85.00",
    mode: "you_owe",
    yourShare: "$14.17",
    status: "Unpaid",
  },
  {
    id: "5",
    title: "Hotel Pool Cabana",
    paidBy: "You",
    date: "Mar 8",
    total: "$120.00",
    mode: "you_owe",
    yourShare: "$0.00",
    status: "Paid",
  },
];

function SummaryMini({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
      }}
    >
      <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>{label}</Text>
      <Text style={{ marginTop: 8, color: valueColor, fontSize: 20, fontWeight: "900" }}>
        {value}
      </Text>
    </View>
  );
}

export default function ExpensesScreen({ navigation }: any) {
  const youOwe = "$42.67";
  const youreOwed = "$87.50";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Top mini summary cards */}
            <Row style={{ gap: 12 }}>
              <SummaryMini label="You Owe" value={youOwe} valueColor={theme.colors.danger} />
              <SummaryMini label="You're Owed" value={youreOwed} valueColor={theme.colors.success} />
            </Row>

            <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "900", color: theme.colors.text }}>
              All Expenses
            </Text>
          </View>
        }
        data={mockExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const pill =
            item.status === "Paid"
              ? { label: "Paid", tone: "success" as const }
              : item.status === "Collecting"
              ? { label: "Collecting", tone: "info" as const }
              : { label: "Unpaid", tone: "danger" as const };

          return (
  <Pressable
    onPress={() => navigation.navigate("ExpenseDetails")}
    style={({ pressed }) => ({
      marginTop: 12,
      opacity: pressed ? 0.92 : 1,
    })}
  >
    <Card>
      {/* Title + amount + date */}
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
            {item.title}
          </Text>
          <Text style={{ marginTop: 6, color: theme.colors.muted, fontWeight: "700" }}>
            Paid by {item.paidBy}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
            {item.total}
          </Text>
          <Text style={{ color: theme.colors.muted, fontWeight: "700" }}>{item.date}</Text>
        </View>
      </Row>

      {/* Bottom row: share/collecting + status */}
      <Row style={{ justifyContent: "space-between", marginTop: 14 }}>
        {item.mode === "you_owe" ? (
          <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
            Your share: <Text style={{ fontWeight: "900" }}>{item.yourShare}</Text>
          </Text>
        ) : (
          <Text style={{ color: theme.colors.success, fontWeight: "900" }}>
            Collecting {item.collecting}
          </Text>
        )}

        <Pill label={pill.label} tone={pill.tone} />
      </Row>
    </Card>
  </Pressable>
);
        }}
      />

      {/* Bottom CTA */}
      <View
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 20,
        }}
      >
        <Pressable
          onPress={() => navigation.navigate("AddExpense")}
          style={({ pressed }) => ({
            backgroundColor: theme.colors.primary,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
            Add New Expense
          </Text>
        </Pressable>
      </View>
    </View>
  );
}