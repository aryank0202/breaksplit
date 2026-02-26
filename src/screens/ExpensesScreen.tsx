import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { theme } from "../theme";
import Card from "../components/Card";
import Pill from "../components/Pill";
import Row from "../components/Row";
import { useTrip, centsToDollars } from "../state/TripStore";

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
  const { state } = useTrip();

  function sum(nums: number[]) {
    return nums.reduce((a, b) => a + b, 0);
  }

  function formatShortDate(ms : number) {
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, {month: "short", day: "numeric" }) // Mar 9 
  }

  function memberName(id : string) {
    return state.members.find((m) => m.id === id)?.name ?? "Unknown";
  }
  const youOweCents = sum (
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
        data={state.expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const paidBy = memberName(item.paidById);
          const total = centsToDollars(item.totalCents);
          const date = formatShortDate(item.createdAt);

          const expenseSplits = state.splits.filter((s) => s.expenseId === item.id);

          // Your split for this expense
          const mySplit = expenseSplits.find((s) => s.memberId === "me");
          const myShareCents = mySplit?.owedCents ?? 0;
          const myShare = centsToDollars(myShareCents);

          // If YOU paid this expense, compute how much you're still collecting
          const collectingCents =
            item.paidById === "me"
              ? sum(expenseSplits.filter((s) => s.memberId !== "me" && !s.paid).map((s) => s.owedCents))
              : 0;

          const collecting = centsToDollars(collectingCents);

          // Status pill logic
          let pill: { label: string; tone: "success" | "danger" | "info" };

          if (item.paidById === "me") {
            // You paid
            pill = collectingCents > 0 ? { label: "Collecting", tone: "info" } : { label: "Paid", tone: "success" };
          } else {
            // Someone else paid
            pill = mySplit && mySplit.paid ? { label: "Paid", tone: "success" } : { label: "Unpaid", tone: "danger" };
          }

          return (
    <Pressable
      onPress={() => navigation.navigate("ExpenseDetails", { expenseId: item.id })}
      style={({ pressed }) => ({
        marginTop: 12,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Card>
        {/* Title + amount + date */}
        <Row style={{ justifyContent: "space-between", marginTop: 14 }}>
  {item.paidById === "me" ? (
    <Text style={{ color: theme.colors.success, fontWeight: "900" }}>
      Collecting {collecting}
    </Text>
  ) : (
    <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
      Your share: <Text style={{ fontWeight: "900" }}>{myShare}</Text>
    </Text>
  )}

  <Pill label={pill.label} tone={pill.tone} />
</Row>

        {/* Status row (temporary, until we compute shares/collecting) */}
        <Row style={{ justifyContent: "space-between", marginTop: 14 }}>
          <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
            Tap to view split details
          </Text>

          <Pill label="Active" tone="info" />
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