import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Alert, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Avatar from "../components/Avatar";
import Pill from "../components/Pill";
import { useTrip } from "../state/TripStore";
import { getTrip, listMembers } from "../api/trips";

type MemberView = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: "admin" | "member";
  photoURL?: string;
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

export default function MembersScreen() {
  const { selectedTripId, currentUser } = useTrip();
  const [members, setMembers] = useState<MemberView[]>([]);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    async function load() {
      if (!selectedTripId || !currentUser) return;
      try {
        const [memberRows, trip] = await Promise.all([listMembers(selectedTripId), getTrip(selectedTripId)]);
        setMembers(
          memberRows.map((member) => {
            const name = member.uid === currentUser.uid ? `You (${member.displayName})` : member.displayName;
            return {
              id: member.uid,
              name,
              email: member.email,
              initials: initialsFromName(name),
              color: colorForUid(member.uid),
              role: member.role,
              photoURL: member.uid === currentUser.uid ? currentUser.photoURL : member.photoURL,
            };
          })
        );
        setInviteCode(trip?.inviteCode ?? "");
      } catch (error: any) {
        Alert.alert("Error", error?.message ?? "Could not load members.");
      }
    }
    void load();
  }, [currentUser, selectedTripId]);

  const totalMembers = useMemo(() => members.length, [members.length]);

  async function copyInviteCode() {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert("Copied", "Invite code copied to clipboard.");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        data={members}
        keyExtractor={(member) => member.id}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#DBEAFE",
              }}
            >
              <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Members</Text>
              <Text style={{ marginTop: 6, fontSize: 28, fontWeight: "900", color: theme.colors.primary }}>{totalMembers}</Text>
            </View>

            <Card style={{ padding: 0, overflow: "hidden" }}>
              <View style={{ padding: 16, paddingBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>All Members</Text>
              </View>
              <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            </Card>
          </View>
        }
        renderItem={({ item, index }) => (
          <Card
            style={{
              padding: 0,
              overflow: "hidden"
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Row style={{ gap: 12 }}>
                <Avatar initials={item.initials} bgColor={item.color} photoURL={item.photoURL} />
                <View style={{ flex: 1 }}>
                  <Row style={{ gap: 8, flexWrap: "wrap" as any }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>{item.name}</Text>
                    {item.role === "admin" ? <Pill label="ADMIN" tone="info" /> : null}
                  </Row>
                  <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "600" }}>{item.email}</Text>
                </View>
              </Row>
            </View>
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          </Card>
        )}
        ListFooterComponent={
          <View style={{ gap: 14, marginTop: 14 }}>
            <Card>
              <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>Invite Friends</Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    padding: 14,
                  }}
                >
                  <Row style={{ justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Invite Code</Text>
                      <Text style={{ marginTop: 8, fontSize: 22, fontWeight: "900", letterSpacing: 1 }}>{inviteCode || "Loading..."}</Text>
                    </View>
                    <Pressable onPress={copyInviteCode} style={{ padding: 10, borderRadius: 12, alignSelf: "center" }}>
                      <Text style={{ fontSize: 18 }}>Copy</Text>
                    </Pressable>
                  </Row>
                </View>
              </View>
            </Card>
          </View>
        }
      />
    </View>
  );
}
