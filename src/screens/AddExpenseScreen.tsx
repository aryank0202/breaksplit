import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Chip from "../components/Chip";
import Segmented from "../components/Segmented";
import { useTrip } from "../state/TripStore";
import { dollarsToCents, formatCents } from "../utils/money";
import { createExpense } from "../api/expenses";
import { listMembers } from "../api/trips";

type SplitMode = "equal" | "custom" | "percent";
type Member = { id: string; name: string };

function sanitizeAmountInput(input: string) {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const hasDot = cleaned.includes(".");
  const [leftRaw = "", ...rest] = cleaned.split(".");
  const rightRaw = rest.join("");
  const left = leftRaw.slice(0, 7);
  if (!hasDot) return left;
  const normalizedLeft = left.length === 0 ? "0" : left;
  const right = rightRaw.slice(0, 2);
  if (cleaned.endsWith(".") && right.length === 0) return `${normalizedLeft}.`;
  return `${normalizedLeft}.${right}`;
}

function toNumber(s: string) {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function AddExpenseScreen({ navigation }: any) {
  const { selectedTripId, currentUser } = useTrip();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const amountCents = useMemo(() => dollarsToCents(amount), [amount]);
  const selectedMembers = useMemo(
    () => members.filter((member) => selectedIds.includes(member.id)),
    [members, selectedIds]
  );

  useEffect(() => {
    async function loadMembers() {
      if (!selectedTripId || !currentUser) return;
      try {
        setLoadingMembers(true);
        const tripMembers = await listMembers(selectedTripId);
        const memberRows = tripMembers.map((member) => ({
          id: member.uid,
          name: member.uid === currentUser.uid ? "You" : member.displayName,
        }));
        setMembers(memberRows);
        setSelectedIds(memberRows.map((member) => member.id));
        setPayerId(currentUser.uid);
      } catch (error: any) {
        Alert.alert("Error", error?.message ?? "Could not load members.");
      } finally {
        setLoadingMembers(false);
      }
    }
    void loadMembers();
  }, [currentUser, selectedTripId]);

  const equalPreview = useMemo(() => {
    if (selectedMembers.length === 0 || amountCents === 0) return [];
    const base = Math.floor(amountCents / selectedMembers.length);
    let remainder = amountCents - base * selectedMembers.length;
    return selectedMembers.map((member) => {
      const owed = base + (remainder > 0 ? 1 : 0);
      remainder -= remainder > 0 ? 1 : 0;
      return { id: member.id, name: member.name, owedCents: owed };
    });
  }, [amountCents, selectedMembers]);

  function toggleMember(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  async function onCreate() {
    if (!selectedTripId) return;
    if (!title.trim() || amountCents <= 0 || selectedIds.length === 0 || !payerId) {
      Alert.alert("Missing fields", "Please complete title, amount, payer and participants.");
      return;
    }

    const customSplits: Record<string, number> = {};
    if (splitMode === "custom") {
      selectedIds.forEach((id) => {
        customSplits[id] = dollarsToCents(customAmounts[id] ?? "0");
      });
      const sum = Object.values(customSplits).reduce((acc, value) => acc + value, 0);
      if (sum !== amountCents) {
        Alert.alert("Totals mismatch", "Custom amounts must add up to the total.");
        return;
      }
    }
    if (splitMode === "percent") {
      selectedIds.forEach((id) => {
        customSplits[id] = toNumber(percentages[id] ?? "0");
      });
      const sum = Object.values(customSplits).reduce((acc, value) => acc + value, 0);
      if (Math.abs(sum - 100) > 0.01) {
        Alert.alert("Percent error", "Percentages must total 100%.");
        return;
      }
    }

    try {
      setCreating(true);
      await createExpense(selectedTripId, {
        title: title.trim(),
        amountCents,
        payerUid: payerId,
        participantUids: selectedIds,
        splitType: splitMode,
        note: "",
        customSplits: splitMode === "equal" ? undefined : customSplits,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Create failed", error?.message ?? "Could not create expense.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{ padding: 20, paddingBottom: 40, gap: 14 }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: theme.colors.text }}>Add Expense</Text>
        {loadingMembers ? <Text style={{ color: theme.colors.muted }}>Loading members...</Text> : null}

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 8 }}>Expense Title</Text>
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
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 8 }}>Amount</Text>
          <Row style={{ gap: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: "900" }}>$</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => setAmount(sanitizeAmountInput(text))}
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
          <Text style={{ marginTop: 8, color: theme.colors.muted, fontWeight: "600" }}>Stored as cents.</Text>
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 10 }}>Who Paid?</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {members.map((member) => (
              <Chip key={member.id} label={member.name} selected={payerId === member.id} onPress={() => setPayerId(member.id)} />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 10 }}>Split Type</Text>
          <Segmented<SplitMode>
            options={[
              { label: "Equal", value: "equal" },
              { label: "Custom", value: "custom" },
              { label: "Percentage", value: "percent" },
            ]}
            value={splitMode}
            onChange={setSplitMode}
          />

          {splitMode === "custom" &&
            selectedMembers.map((member) => (
              <Row key={member.id} style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <Text style={{ fontWeight: "900" }}>{member.name}</Text>
                <TextInput
                  value={customAmounts[member.id] ?? ""}
                  onChangeText={(text) => setCustomAmounts((prev) => ({ ...prev, [member.id]: sanitizeAmountInput(text) }))}
                  placeholder="$0.00"
                  keyboardType="decimal-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    width: 100,
                    textAlign: "right",
                  }}
                />
              </Row>
            ))}

          {splitMode === "percent" &&
            selectedMembers.map((member) => (
              <Row key={member.id} style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <Text style={{ fontWeight: "900" }}>{member.name}</Text>
                <Row style={{ gap: 10, alignItems: "center" }}>
                  <TextInput
                    value={percentages[member.id] ?? ""}
                    onChangeText={(text) => setPercentages((prev) => ({ ...prev, [member.id]: text }))}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      width: 60,
                      textAlign: "right",
                    }}
                  />
                  <Text style={{ fontWeight: "900" }}>%</Text>
                </Row>
              </Row>
            ))}
        </Card>

        <Card>
          <Text style={{ color: theme.colors.muted, fontWeight: "800", marginBottom: 10 }}>Participants</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {members.map((member) => (
              <Chip key={member.id} label={member.name} selected={selectedIds.includes(member.id)} onPress={() => toggleMember(member.id)} />
            ))}
          </View>

          <Text style={{ marginTop: 12, fontWeight: "900", color: theme.colors.text }}>Split Preview</Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {equalPreview.length === 0 ? (
              <Text style={{ color: theme.colors.muted, fontWeight: "600" }}>Enter amount and participants to preview.</Text>
            ) : (
              equalPreview.map((row) => (
                <Row key={row.id} style={{ justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "800", color: theme.colors.text }}>{row.name}</Text>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>{formatCents(row.owedCents)}</Text>
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
          disabled={creating}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>{creating ? "Creating..." : "Create Expense"}</Text>
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
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
