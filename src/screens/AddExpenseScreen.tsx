import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Chip from "../components/Chip";
import Segmented from "../components/Segmented";
import { useTrip } from "../state/TripStore";

type SplitMode = "equal" | "custom" | "percentage";

type Member = {
  id: string;
  name: string;
};


function dollarsToCents(input: string) {
  // allow "12", "12.3", "12.34"
  const normalized = input.replace(/[^0-9.]/g, "");
  if (!normalized) return 0;
  const num = Number(normalized);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function AddExpenseScreen({ navigation }: any) {
  const { state, addExpense } = useTrip();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(""); // dollars string
  const [payerId, setPayerId] = useState("me");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const [selectedIds, setSelectedIds] = useState<string[]>(
  state.members.map((m) => m.id)
);

  const amountCents = useMemo(() => dollarsToCents(amount), [amount]);

  // helpers for new split modes
  function toCentsFromMoneyText(s: string) {
    const n = Number(s.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }

  function toNumber(s: string) {
    const n = Number(s.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function dollarsFromCents(cents: number) {
    return (cents / 100).toFixed(2);
  }

  const selectedMembers = useMemo(
  () => state.members.filter((m) => selectedIds.includes(m.id)),
  [state.members, selectedIds]
);

  const equalPreview = useMemo(() => {
    const n = selectedMembers.length;
    if (n === 0 || amountCents === 0) return [];
    const base = Math.floor(amountCents / n);
    const remainder = amountCents % n;

    return selectedMembers.map((m, idx) => {
      const owed = base + (idx < remainder ? 1 : 0);
      return { id: m.id, name: m.name, owedCents: owed };
    });
  }, [selectedMembers, amountCents]);

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function onCreate() {
    // validations per mode
    if (splitMode === "custom") {
      const sumCustom = selectedIds.reduce(
        (acc, id) => acc + toCentsFromMoneyText(customAmounts[id] ?? "0"),
        0
      );
      if (sumCustom !== amountCents) {
        Alert.alert("Totals mismatch", "Custom amounts must add up to expense total.");
        return;
      }
    }

    if (splitMode === "percentage") {
      const pctSum = selectedIds.reduce(
        (acc, id) => acc + toNumber(percentages[id] ?? "0"),
        0
      );
      if (Math.abs(pctSum - 100) > 0.01) {
        Alert.alert("Percent error", "Percentages must total 100%.");
        return;
      }
    }

    // create expense with proper payload
    const basePayload: any = {
      title: title.trim(),
      totalCents: amountCents,
      paidById: payerId,
      participantIds: selectedIds,
      notes: "", // optional
      splitMode,
    };

    if (splitMode === "custom") {
      const map: Record<string, number> = {};
      selectedIds.forEach((id) => {
        map[id] = toCentsFromMoneyText(customAmounts[id] ?? "0");
      });
      basePayload.customAmountsCents = map;
    }

    if (splitMode === "percentage") {
      const map: Record<string, number> = {};
      selectedIds.forEach((id) => {
        map[id] = toNumber(percentages[id] ?? "0");
      });
      basePayload.percentages = map;
    }

    const expenseId = addExpense(basePayload);
    navigation.goBack();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ padding: 20, paddingBottom: 40, gap: 14 }}>
        <Text style={{ fontSize: 26, fontWeight: "900", color: theme.colors.text }}>
          Add Expense
        </Text>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 8 }}>
            Expense Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Uber to South Beach"
            placeholderTextColor="#9CA3AF"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              fontWeight: "700",
              color: theme.colors.text,
            }}
          />
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 8 }}>
            Amount
          </Text>
          <Row style={{ gap: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: "900" }}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 18,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            />
          </Row>
          <Text style={{ marginTop: 8, color: theme.colors.muted, fontWeight: "600" }}>
            Stored as cents to avoid rounding issues.
          </Text>
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 10 }}>
            Who Paid?
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {state.members.map((m) => (
              <Chip
                key={m.id}
                label={m.name}
                selected={payerId === m.id}
                onPress={() => setPayerId(m.id)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 10 }}>
            Split Type
          </Text>
<Segmented<SplitMode>
            options={[
              { label: "Equal", value: "equal" },
              { label: "Custom", value: "custom" },
              { label: "Percentage", value: "percentage" },
            ]}
            value={splitMode}
            onChange={setSplitMode}
          />

          {/* mode-specific UI */}
          {splitMode === "custom" && selectedMembers.map((m) => (
            <Row
              key={m.id}
              style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10 }}
            >
              <Text style={{ fontWeight: "900" }}>{m.name}</Text>
              <TextInput
                value={customAmounts[m.id] ?? ""}
                onChangeText={(t) => setCustomAmounts((prev) => ({ ...prev, [m.id]: t }))}
                placeholder="$0.00"
                keyboardType="decimal-pad"
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  fontSize: 16,
                  fontWeight: "700",
                  color: theme.colors.text,
                  width: 100,
                  textAlign: "right",
                }}
              />
            </Row>
          ))}

          {splitMode === "percentage" && selectedMembers.map((m) => {
            const pct = toNumber(percentages[m.id] ?? "0");
            const cents = Math.round((amountCents * pct) / 100);
            return (
              <Row
                key={m.id}
                style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10 }}
              >
                <Text style={{ fontWeight: "900" }}>{m.name}</Text>

                <Row style={{ gap: 10, alignItems: "center" }}>
                  <TextInput
                    value={percentages[m.id] ?? ""}
                    onChangeText={(t) => setPercentages((prev) => ({ ...prev, [m.id]: t }))}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      fontSize: 16,
                      fontWeight: "700",
                      color: theme.colors.text,
                      width: 60,
                      textAlign: "right",
                    }}
                  />
                  <Text style={{ fontWeight: "900" }}>%</Text>
                  <Text style={{ color: theme.colors.muted, fontWeight: "900" }}>
                    ${dollarsFromCents(cents)}
                  </Text>
                </Row>
              </Row>
            );
          })}
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 10 }}>
            Participants
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {state.members.map((m) => (
              <Chip
                key={m.id}
                label={m.name}
                selected={selectedIds.includes(m.id)}
                onPress={() => toggleMember(m.id)}
              />
            ))}
          </View>

          <Text style={{ marginTop: 12, fontWeight: "900", color: theme.colors.text }}>
            Split Preview
          </Text>

          <View style={{ marginTop: 10, gap: 8 }}>
            {equalPreview.length === 0 ? (
              <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>
                Enter an amount and select participants to see a preview.
              </Text>
            ) : (
              equalPreview.map((row) => (
                <Row key={row.id} style={{ justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "800", color: theme.colors.text }}>
                    {row.name}
                  </Text>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                    ${centsToDollars(row.owedCents)}
                  </Text>
                </Row>
              ))
            )}
          </View>
        </Card>

        <Pressable
          onPress={onCreate}
          style={({ pressed }) => ({
            backgroundColor: theme.colors.primary,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            marginTop: 4,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
            Create Expense
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: "white",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}