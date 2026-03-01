import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Avatar from "../components/Avatar";
import Pill from "../components/Pill";
import { useTrip } from "../state/TripStore";
import { confirmSplitPaid, listExpenseSplits, listExpenses, markMySplitPaid } from "../api/expenses";
import { listMembers } from "../api/trips";
import { formatCents } from "../utils/money";
import { openVenmoPay } from "../utils/venmo";

type SplitRow = {
  memberId: string;
  name: string;
  initials: string;
  color: string;
  owesCents: number;
  state: "unpaid" | "marked_paid" | "confirmed";
  venmoHandle?: string;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function colorForUid(uid: string) {
  const palette = ["#22C55E", "#3B82F6", "#A855F7", "#EC4899", "#F97316", "#14B8A6"];
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) hash += uid.charCodeAt(i);
  return palette[Math.abs(hash) % palette.length];
}

export default function ExpenseDetailsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { selectedTripId, currentUser } = useTrip();
  const expenseId = route?.params?.expenseId as string;
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<any | null>(null);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      if (!selectedTripId || !currentUser) return;
      try {
        setLoading(true);
        const [expenses, members, splits] = await Promise.all([
          listExpenses(selectedTripId),
          listMembers(selectedTripId),
          listExpenseSplits(selectedTripId, expenseId),
        ]);
        const expenseRow = expenses.find((row) => row.id === expenseId);
        if (!expenseRow) {
          setExpense(null);
          return;
        }
        setExpense(expenseRow);
        const memberById = new Map(members.map((member) => [member.uid, member]));
        const rowData = splits.map((split) => {
          const member = memberById.get(split.uid);
          const name = split.uid === currentUser.uid ? "You" : member?.displayName ?? "Unknown";
          return {
            memberId: split.uid,
            name,
            initials: initialsFromName(name),
            color: colorForUid(split.uid),
            owesCents: split.owedCents,
            state: split.state,
            venmoHandle: member?.venmoHandle,
          } as SplitRow;
        });
        rowData.sort((a, b) => a.name.localeCompare(b.name));
        setSplitRows(rowData);
        setIsAdmin((memberById.get(currentUser.uid)?.role ?? "member") === "admin");
      } catch (error: any) {
        Alert.alert("Load failed", error?.message ?? "Could not load expense details.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [currentUser, expenseId, selectedTripId]);

  async function reload() {
    if (!selectedTripId || !currentUser) return;
    const [expenses, splits] = await Promise.all([
      listExpenses(selectedTripId),
      listExpenseSplits(selectedTripId, expenseId),
    ]);
    setExpense(expenses.find((row) => row.id === expenseId) ?? null);
    setSplitRows((prev) =>
      prev.map((row) => {
        const fresh = splits.find((split) => split.uid === row.memberId);
        return fresh ? { ...row, state: fresh.state, owesCents: fresh.owedCents } : row;
      })
    );
  }

  const payer = useMemo(() => splitRows.find((row) => row.memberId === expense?.payerUid), [expense?.payerUid, splitRows]);
  const mySplit = useMemo(() => splitRows.find((row) => row.memberId === currentUser?.uid), [currentUser?.uid, splitRows]);
  const canConfirm = currentUser?.uid === expense?.payerUid || isAdmin;
  const canPay = Boolean(payer?.venmoHandle && mySplit && mySplit.memberId !== expense?.payerUid && mySplit.owesCents > 0);

  async function onMarkPaid() {
    if (!selectedTripId || !currentUser) return;
    try {
      await markMySplitPaid(selectedTripId, expenseId, currentUser.uid);
      await reload();
    } catch (error: any) {
      Alert.alert("Update failed", error?.message ?? "Could not mark as paid.");
    }
  }

  async function onConfirm(uid: string) {
    if (!selectedTripId) return;
    try {
      await confirmSplitPaid(selectedTripId, expenseId, uid);
      await reload();
    } catch (error: any) {
      Alert.alert("Confirm failed", error?.message ?? "Could not confirm payment.");
    }
  }

  async function onPayVenmo() {
    if (!payer?.venmoHandle || !mySplit || !expense) return;
    try {
      await openVenmoPay({
        recipientHandle: payer.venmoHandle,
        amountDollars: (mySplit.owesCents / 100).toFixed(2),
        note: `${expense.title} via BreakSplit`,
      });
    } catch (error: any) {
      Alert.alert("Venmo error", error?.message ?? "Could not open Venmo.");
    }
  }

  if (!expense && !loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontWeight: "900", color: theme.colors.text }}>Expense not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 14, paddingBottom: 10, backgroundColor: theme.colors.bg }}>
        <Row style={{ gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => navigation.goBack()} style={{ padding: 10, borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: theme.colors.primary }}>{"<"}</Text>
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: "900", color: theme.colors.text }}>Expense Details</Text>
        </Row>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 170 }}
        data={splitRows}
        keyExtractor={(row) => row.memberId}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <Card>
              <Text style={{ fontSize: 18, fontWeight: "900", color: theme.colors.text }}>{expense?.title ?? "Loading..."}</Text>
              <Text style={{ marginTop: 14, color: theme.colors.muted, fontWeight: "800" }}>Total Amount</Text>
              <Text style={{ marginTop: 6, fontSize: 28, fontWeight: "900", color: theme.colors.text }}>
                {expense ? formatCents(expense.amountCents) : "$0.00"}
              </Text>
              <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 14 }} />
              <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Paid by</Text>
              <Row style={{ gap: 12, marginTop: 10 }}>
                <Avatar initials={payer?.initials ?? "?"} bgColor={payer?.color ?? "#9CA3AF"} />
                <Text style={{ fontWeight: "900", color: theme.colors.text }}>{payer?.name ?? "Unknown"}</Text>
              </Row>
            </Card>
          </View>
        }
        renderItem={({ item }) => {
          const pill =
            item.state === "confirmed"
              ? { label: "Confirmed", tone: "success" as const }
              : item.state === "marked_paid"
              ? { label: "Marked Paid", tone: "info" as const }
              : { label: "Unpaid", tone: "danger" as const };
          return (
            <Card style={{ marginTop: 12 }}>
              <Row style={{ gap: 12, alignItems: "center" }}>
                <Avatar initials={item.initials} bgColor={item.color} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>{item.name}</Text>
                  <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "700" }}>
                    Owes {formatCents(item.owesCents)}
                  </Text>
                </View>
                <Pill label={pill.label} tone={pill.tone} />
              </Row>
              {canConfirm && item.memberId !== expense?.payerUid && item.state !== "confirmed" ? (
                <Pressable
                  onPress={() => onConfirm(item.memberId)}
                  style={{
                    marginTop: 10,
                    minHeight: 40,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#93C5FD",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#EFF6FF",
                  }}
                >
                  <Text style={{ fontWeight: "800", color: "#1D4ED8" }}>Confirm</Text>
                </Pressable>
              ) : null}
            </Card>
          );
        }}
        ListEmptyComponent={loading ? <Text style={{ color: theme.colors.muted }}>Loading...</Text> : null}
      />

      {mySplit && mySplit.memberId !== expense?.payerUid ? (
        <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 + insets.bottom, gap: 10 }}>
          <Pressable
            onPress={onPayVenmo}
            disabled={!canPay}
            style={({ pressed }) => ({
              backgroundColor: canPay ? "#3B82F6" : "#D1D5DB",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
              Pay in Venmo ({formatCents(mySplit.owesCents)})
            </Text>
          </Pressable>
          {!canPay ? <Text style={{ color: "#64748B", textAlign: "center", fontSize: 12 }}>Payer has no Venmo handle set.</Text> : null}

          <Pressable
            onPress={onMarkPaid}
            disabled={mySplit.state !== "unpaid"}
            style={({ pressed }) => ({
              backgroundColor: mySplit.state === "unpaid" ? "white" : "#E5E7EB",
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 16 }}>
              {mySplit.state === "unpaid" ? "Mark Paid" : mySplit.state === "marked_paid" ? "Marked Paid" : "Confirmed"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
