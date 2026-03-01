import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { theme } from "../theme";
import Card from "../components/Card";
import Pill from "../components/Pill";
import Row from "../components/Row";
import { useTrip } from "../state/TripStore";
import { computeTotals, listExpenses, type ListedExpense } from "../api/expenses";
import { formatCents } from "../utils/money";
import { listMembers } from "../api/trips";

function SummaryMini({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
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
      <Text style={{ marginTop: 8, color: valueColor, fontSize: 20, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

export default function ExpensesScreen({ navigation }: any) {
  const { selectedTripId, currentUser } = useTrip();
  const [expenses, setExpenses] = useState<ListedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [youOwe, setYouOwe] = useState("$0.00");
  const [youreOwed, setYoureOwed] = useState("$0.00");
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      if (!selectedTripId || !currentUser) return;
      try {
        setLoading(true);
        const [expenseRows, totals, members] = await Promise.all([
          listExpenses(selectedTripId),
          computeTotals(selectedTripId, currentUser.uid),
          listMembers(selectedTripId),
        ]);
        const nameMap: Record<string, string> = {};
        members.forEach((member) => {
          nameMap[member.uid] = member.uid === currentUser.uid ? "You" : member.displayName;
        });
        setMemberNames(nameMap);
        setExpenses(expenseRows);
        setYouOwe(formatCents(totals.youOweCents));
        setYoureOwed(formatCents(totals.youreOwedCents));
      } catch (error: any) {
        Alert.alert("Error", error?.message ?? "Could not load expenses.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [currentUser, selectedTripId]);

  const emptyText = useMemo(() => (loading ? "Loading..." : "No expenses yet."), [loading]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <Row style={{ gap: 12 }}>
              <SummaryMini label="You Owe" value={youOwe} valueColor={theme.colors.danger} />
              <SummaryMini label="You're Owed" value={youreOwed} valueColor={theme.colors.success} />
            </Row>
            <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "900", color: theme.colors.text }}>All Expenses</Text>
          </View>
        }
        data={expenses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ marginTop: 20, color: theme.colors.muted }}>{emptyText}</Text>}
        renderItem={({ item }) => {
          const paidBy = memberNames[item.payerUid] ?? "Unknown";
          const total = formatCents(item.amountCents);
          const myShare = formatCents(item.myShareCents);
          const collecting = formatCents(item.collectingCents);

          const pill =
            item.statusLabel === "Collecting"
              ? { label: "Collecting", tone: "info" as const }
              : item.statusLabel === "Paid/Confirmed"
              ? { label: "Paid/Confirmed", tone: "success" as const }
              : { label: "Unpaid", tone: "danger" as const };

          return (
            <Pressable
              onPress={() => navigation.navigate("ExpenseDetails", { expenseId: item.id })}
              style={({ pressed }) => ({
                marginTop: 12,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Card>
                <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 16 }}>{item.title}</Text>
                <Text style={{ color: theme.colors.muted, marginTop: 4, fontWeight: "600" }}>
                  Paid by {paidBy} • {new Date(item.createdAtMs || Date.now()).toLocaleDateString()}
                </Text>
                <Row style={{ justifyContent: "space-between", marginTop: 12 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: "900" }}>Total: {total}</Text>
                  <Pill label={pill.label} tone={pill.tone} />
                </Row>
                <Row style={{ justifyContent: "space-between", marginTop: 10 }}>
                  {item.payerUid === currentUser?.uid ? (
                    <Text style={{ color: theme.colors.success, fontWeight: "900" }}>Collecting {collecting}</Text>
                  ) : (
                    <Text style={{ color: theme.colors.text, fontWeight: "800" }}>Your share: {myShare}</Text>
                  )}
                </Row>
              </Card>
            </Pressable>
          );
        }}
      />

      <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
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
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Add New Expense</Text>
        </Pressable>
      </View>
    </View>
  );
}
