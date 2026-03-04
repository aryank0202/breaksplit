import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Avatar from "../components/Avatar";
import Pill from "../components/Pill";
import { useTrip } from "../state/TripStore";
import { listExpenseSplits, listExpenses, markMySplitPaid } from "../api/expenses";
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
  const { selectedTripId, currentUser, bumpTripDataVersion } = useTrip();
  const expenseId = route?.params?.expenseId as string;
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<any | null>(null);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);
  const [showVenmoModal, setShowVenmoModal] = useState(false);

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
          const name = member?.displayName ?? "Unknown";
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
  const canPay = Boolean(payer?.venmoHandle && mySplit && mySplit.memberId !== expense?.payerUid && mySplit.owesCents > 0);

  async function onMarkPaid() {
    if (!selectedTripId || !currentUser) return;
    try {
      await markMySplitPaid(selectedTripId, expenseId, currentUser.uid);
      bumpTripDataVersion();
      await reload();
    } catch (error: any) {
      Alert.alert("Update failed", error?.message ?? "Could not mark as paid.");
    }
  }

  async function onOpenVenmoFromModal() {
    if (!payer?.venmoHandle || !mySplit || !expense) return;
    try {
      setShowVenmoModal(false);
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
        data={splitRows.filter((row) => row.memberId !== expense?.payerUid)}
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
            </Card>
          );
        }}
        ListEmptyComponent={loading ? <Text style={{ color: theme.colors.muted }}>Loading...</Text> : null}
      />

      {mySplit && mySplit.memberId !== expense?.payerUid ? (
        <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 + insets.bottom, gap: 10 }}>
          <Pressable
            onPress={() => setShowVenmoModal(true)}
            style={({ pressed }) => ({
              backgroundColor: "#3B82F6",
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

      <Modal visible={showVenmoModal} transparent animationType="fade" onRequestClose={() => setShowVenmoModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.28)",
            justifyContent: "center",
            paddingHorizontal: 16,
          }}
        >
          <View style={{ backgroundColor: "white", borderRadius: 22, padding: 16 }}>
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 44, height: 4, borderRadius: 999, backgroundColor: "#D1D5DB", marginBottom: 20 }} />
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#DBEAFE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 999, borderWidth: 3, borderColor: "#3B82F6" }} />
              </View>
              <Text style={{ marginTop: 16, fontWeight: "900", color: "#0F172A", fontSize: 33, lineHeight: 34 }}>Open Venmo?</Text>
              <Text style={{ marginTop: 10, color: "#334155", textAlign: "center", fontSize: 18, lineHeight: 24 }}>
                After sending payment, return to BreakSplit and tap 'Mark as Paid'.
              </Text>
            </View>

            <Pressable
              onPress={onOpenVenmoFromModal}
              disabled={!canPay}
              style={{
                marginTop: 18,
                minHeight: 54,
                borderRadius: 14,
                backgroundColor: canPay ? "#4294CC" : "#D1D5DB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 20 }}>Open Venmo</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowVenmoModal(false)}
              style={{
                marginTop: 10,
                minHeight: 54,
                borderRadius: 14,
                backgroundColor: "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 20 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
