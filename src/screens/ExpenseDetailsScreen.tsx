import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Avatar from "../components/Avatar";
import Pill from "../components/Pill";
import { useTrip, centsToDollars } from "../state/TripStore";

type SplitRow = {
  memberId: string;
  name: string;
  initials: string;
  color: string;
  owes: string;
  paid: boolean;
};

export default function ExpenseDetailsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [showVenmoModal, setShowVenmoModal] = useState(false);

  const { state, togglePaid } = useTrip();
  const expenseId = route?.params?.expenseId as string;

  const expense = state.expenses.find((e) => e.id === expenseId);

  if (!expense) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
          Expense not found.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            marginTop: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: "white",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const payer = state.members.find((m) => m.id === expense.paidById);

  const splitRows: SplitRow[] = useMemo(() => {
    return state.splits
      .filter((s) => s.expenseId === expenseId)
      .map((s) => {
        const member = state.members.find((m) => m.id === s.memberId);
        return {
          memberId: s.memberId,
          name: member?.name ?? "Unknown",
          initials: member?.initials ?? "?",
          color: member?.color ?? "#9CA3AF",
          owes: centsToDollars(s.owedCents),
          paid: s.paid,
        };
      });
  }, [state.splits, state.members, expenseId]);

  const mySplit = state.splits.find((s) => s.expenseId === expenseId && s.memberId === "me");
  const myShare = mySplit ? centsToDollars(mySplit.owedCents) : "$0.00";

  const payLabel = useMemo(() => `Pay ${myShare} in Venmo`, [myShare]);

  function onOpenVenmo() {
    // Later: open Venmo deep link using handle + amount + note
    setShowVenmoModal(false);

    // Optional UX for now: mark YOU as paid after "Open Venmo"
    if (mySplit && !mySplit.paid) {
      togglePaid(expenseId, "me", true);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 14,
          paddingBottom: 10,
          backgroundColor: theme.colors.bg,
        }}
      >
        <Row style={{ gap: 10 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              padding: 10,
              borderRadius: 12,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontSize: 18, fontWeight: "900", color: theme.colors.primary }}>‹</Text>
          </Pressable>

          <Text style={{ fontSize: 22, fontWeight: "900", color: theme.colors.text }}>
            Expense Details
          </Text>
        </Row>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        data={splitRows}
        keyExtractor={(x) => x.memberId}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Top expense card */}
            <Card>
              <Text style={{ fontSize: 18, fontWeight: "900", color: theme.colors.text }}>
                {expense.title}
              </Text>

              <Text style={{ marginTop: 14, color: theme.colors.muted, fontWeight: "800" }}>
                Total Amount
              </Text>
              <Text style={{ marginTop: 6, fontSize: 28, fontWeight: "900", color: theme.colors.text }}>
                {centsToDollars(expense.totalCents)}
              </Text>

              <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 14 }} />

              <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Paid by</Text>

              <Row style={{ gap: 12, marginTop: 10 }}>
                <Avatar initials={payer?.initials ?? "?"} bgColor={payer?.color ?? "#9CA3AF"} />
                <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                  {payer?.name ?? "Unknown"}
                </Text>
              </Row>
            </Card>

            {/* Split between card header */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <View style={{ padding: 16, paddingBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
                  Split Between
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            </Card>
          </View>
        }
        renderItem={({ item, index }) => {
          const pill = item.paid
            ? { label: "Paid", tone: "success" as const }
            : { label: "Unpaid", tone: "danger" as const };

          return (
            <Card
              style={{
                padding: 0,
                overflow: "hidden",
                marginTop: index === 0 ? -4 : 0,
                borderTopLeftRadius: index === 0 ? 0 : theme.radius.card,
                borderTopRightRadius: index === 0 ? 0 : theme.radius.card,
              }}
            >
              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <Row style={{ gap: 12 }}>
                  <Avatar initials={item.initials} bgColor={item.color} />

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>{item.name}</Text>
                    <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "700" }}>
                      Owes {item.owes}
                    </Text>
                  </View>

                  <Pill label={pill.label} tone={pill.tone} />
                </Row>
              </View>

              <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            </Card>
          );
        }}
        ListFooterComponent={
          <View style={{ gap: 14, marginTop: 14 }}>
            {/* Notes */}
            <Card>
              <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
                Notes
              </Text>
              <Text style={{ marginTop: 10, color: theme.colors.muted, fontWeight: "600", lineHeight: 20 }}>
                {expense.notes?.trim()
                  ? expense.notes
                  : "No notes for this expense yet."}
              </Text>
            </Card>
          </View>
        }
      />

      {/* Bottom Pay button */}
      <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 + insets.bottom }}>
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
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>{payLabel}</Text>
        </Pressable>
      </View>

      {/* Venmo confirmation modal */}
      <Modal visible={showVenmoModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 20 + insets.bottom,
            }}
          >
            <View style={{ alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  backgroundColor: "#DBEAFE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    borderWidth: 3,
                    borderColor: theme.colors.primary,
                  }}
                />
              </View>

              <Text style={{ fontSize: 18, fontWeight: "900", color: theme.colors.text }}>
                Open Venmo?
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.muted,
                  fontWeight: "600",
                  lineHeight: 20,
                }}
              >
                After sending payment, return to BreakSplit and tap "Mark as Paid".
              </Text>
            </View>

            <View style={{ marginTop: 18, gap: 10 }}>
              <Pressable
                onPress={onOpenVenmo}
                style={({ pressed }) => ({
                  backgroundColor: "#3B82F6",
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                  Open Venmo
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowVenmoModal(false)}
                style={({ pressed }) => ({
                  backgroundColor: "white",
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 16 }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}