import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, Alert, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import Avatar from "../components/Avatar";
import Pill from "../components/Pill";

type Member = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  isAdmin?: boolean;
};

const mockMembers: Member[] = [
  { id: "1", name: "Mike Johnson", email: "mike.j@email.com", initials: "MJ", color: "#22C55E", isAdmin: true },
  { id: "2", name: "You (Alex Chen)", email: "alex.c@email.com", initials: "ME", color: "#3B82F6", isAdmin: true },
  { id: "3", name: "Sarah Martinez", email: "sarah.m@email.com", initials: "SM", color: "#A855F7" },
  { id: "4", name: "Emma Kim", email: "emma.k@email.com", initials: "EK", color: "#EC4899" },
  { id: "5", name: "Jake Lopez", email: "jake.l@email.com", initials: "JL", color: "#F97316" },
  { id: "6", name: "Lisa Wang", email: "lisa.w@email.com", initials: "LW", color: "#14B8A6" },
];

export default function MembersScreen() {
  const inviteCode = "MIAMI2026";

  const totalMembers = useMemo(() => mockMembers.length, []);

  async function copyInviteCode() {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert("Copied", "Invite code copied to clipboard.");
  }

  async function shareInviteLink() {
    // Later this can be a real dynamic link. For now it's a placeholder.
    const link = `https://breaksplit.app/join/${inviteCode}`;
    await Share.share({
      message: `Join our trip on BreakSplit!\nInvite code: ${inviteCode}\nLink: ${link}`,
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        data={mockMembers}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Total Members */}
            <View
              style={{
                backgroundColor: "#EFF6FF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#DBEAFE",
              }}
            >
              <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Total Members</Text>
              <Text style={{ marginTop: 6, fontSize: 28, fontWeight: "900", color: theme.colors.primary }}>
                {totalMembers}
              </Text>
            </View>

            {/* All Members list wrapper */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <View style={{ padding: 16, paddingBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
                  All Members
                </Text>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            </Card>
          </View>
        }
        renderItem={({ item, index }) => (
          <Card
            style={{
              padding: 0,
              overflow: "hidden",
              marginTop: index === 0 ? -4 : 0, // pulls first row into the "All Members" card visually
              borderTopLeftRadius: index === 0 ? 0 : theme.radius.card,
              borderTopRightRadius: index === 0 ? 0 : theme.radius.card,
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Row style={{ gap: 12 }}>
                <Avatar initials={item.initials} bgColor={item.color} />

                <View style={{ flex: 1 }}>
                  <Row style={{ gap: 8, flexWrap: "wrap" as any }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                      {item.name}
                    </Text>

                    {item.isAdmin ? <Pill label="👑 ADMIN" tone="info" /> : null}
                  </Row>

                  <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "600" }}>
                    {item.email}
                  </Text>
                </View>
              </Row>
            </View>

            {/* Row divider */}
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          </Card>
        )}
        ListFooterComponent={
          <View style={{ gap: 14, marginTop: 14 }}>
            {/* Invite Friends */}
            <Card>
              <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
                Invite Friends
              </Text>

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
                      <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>
                        Invite Code
                      </Text>
                      <Text style={{ marginTop: 8, fontSize: 22, fontWeight: "900", letterSpacing: 1 }}>
                        {inviteCode}
                      </Text>
                    </View>

                    <Pressable
                      onPress={copyInviteCode}
                      style={({ pressed }) => ({
                        padding: 10,
                        borderRadius: 12,
                        opacity: pressed ? 0.9 : 1,
                        alignSelf: "center",
                      })}
                    >
                      <Text style={{ fontSize: 18 }}>⧉</Text>
                    </Pressable>
                  </Row>
                </View>

                <Pressable
                  onPress={shareInviteLink}
                  style={({ pressed }) => ({
                    backgroundColor: theme.colors.primary,
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: "center",
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                    Share Invite Link
                  </Text>
                </Pressable>
              </View>
            </Card>

            {/* Tip card */}
            <View
              style={{
                backgroundColor: "#EFF6FF",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: "#DBEAFE",
              }}
            >
              <Text style={{ color: theme.colors.primary, fontWeight: "800" }}>
                Tip:{" "}
                <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                  Members can view and edit the itinerary. Only admins can manage expenses and members.
                </Text>
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
}