import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Chip from "../components/Chip";
import Segmented from "../components/Segmented";

type SplitType = "equal" | "custom" | "percent";

type Member = {
  id: string;
  name: string;
};

const mockMembers: Member[] = [
  { id: "aryan", name: "Aryan" },
  { id: "sarah", name: "Sarah" },
  { id: "mike", name: "Mike" },
  { id: "emma", name: "Emma" },
  { id: "jake", name: "Jake" },
];

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
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(""); // dollars string
  const [payerId, setPayerId] = useState("aryan");
  const [splitType, setSplitType] = useState<SplitType>("equal");

  const [selectedIds, setSelectedIds] = useState<string[]>(
    mockMembers.map((m) => m.id)
  );

  const amountCents = useMemo(() => dollarsToCents(amount), [amount]);

  const selectedMembers = useMemo(
    () => mockMembers.filter((m) => selectedIds.includes(m.id)),
    [selectedIds]
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
    if (!title.trim()) {
      Alert.alert("Missing title", "Add a title like Uber, dinner, groceries, etc.");
      return;
    }
    if (amountCents <= 0) {
      Alert.alert("Invalid amount", "Enter a valid amount.");
      return;
    }
    if (selectedMembers.length < 2) {
      Alert.alert("Select participants", "Pick at least 2 people to split with.");
      return;
    }

    // UI-only MVP: just show what would be created
    Alert.alert(
      "Expense created (mock)",
      `${title} • $${centsToDollars(amountCents)} • payer: ${payerId} • split: ${splitType}`
    );

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
            {mockMembers.map((m) => (
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
          <Segmented<SplitType>
            options={[
              { label: "Equal", value: "equal" },
              { label: "Custom", value: "custom" },
              { label: "Percent", value: "percent" },
            ]}
            value={splitType}
            onChange={setSplitType}
          />

          {splitType !== "equal" ? (
            <Text style={{ marginTop: 10, color: theme.colors.muted, fontWeight: "600" }}>
              UI coming next: for now, preview uses Equal split.
            </Text>
          ) : null}
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 10 }}>
            Participants
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {mockMembers.map((m) => (
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