import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";

type Day = { id: string; label: string };

type ItineraryItem = {
  id: string;
  dayId: string;
  time: string;
  title: string;
  location: string;
  note?: string;
};

const days: Day[] = [
  { id: "day1", label: "Day 1" },
  { id: "day2", label: "Day 2" },
  { id: "day3", label: "Day 3" },
  { id: "day4", label: "Day 4" },
  { id: "day5", label: "Day 5" },
];

const mockItems: ItineraryItem[] = [
  {
    id: "1",
    dayId: "day1",
    time: "10:00 AM",
    title: "Arrival & Check-in",
    location: "The Setai Miami Beach",
    note: "Front desk confirmation #2847",
  },
  {
    id: "2",
    dayId: "day1",
    time: "2:00 PM",
    title: "Lunch at Joe's Stone Crab",
    location: "11 Washington Ave",
  },
  {
    id: "3",
    dayId: "day1",
    time: "7:00 PM",
    title: "Sunset at South Beach",
    location: "Ocean Drive",
    note: "Bring cameras!",
  },
];

function DayChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: active ? theme.colors.primary : theme.colors.surface,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
        opacity: pressed ? 0.9 : 1,
        minWidth: 74,
        alignItems: "center",
      })}
    >
      <Text style={{ fontWeight: "900", color: active ? "white" : theme.colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function TimelineDot() {
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        marginTop: 18,
      }}
    />
  );
}

function TimelineLine() {
  return (
    <View
      style={{
        width: 2,
        flex: 1,
        backgroundColor: "#E5E7EB",
        marginLeft: 4,
        marginTop: 6,
      }}
    />
  );
}

export default function ItineraryDayScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [activeDayId, setActiveDayId] = useState<string>("day1");

  const items = useMemo(
    () => mockItems.filter((x) => x.dayId === activeDayId),
    [activeDayId]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Custom header (so it looks like your screenshot) */}
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
            <Text style={{ fontSize: 18, fontWeight: "900", color: theme.colors.primary }}>
              ‹
            </Text>
          </Pressable>

          <Text style={{ fontSize: 22, fontWeight: "900", color: theme.colors.text }}>
            Itinerary
          </Text>
        </Row>

        {/* Day selector */}
        <View style={{ marginTop: 14 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 6 }}>
              {days.map((d) => (
                <DayChip
                  key={d.id}
                  label={d.label}
                  active={d.id === activeDayId}
                  onPress={() => setActiveDayId(d.id)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Timeline list */}
      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
            {/* Timeline rail */}
            <View style={{ alignItems: "center", width: 16 }}>
              <TimelineDot />
              <TimelineLine />
            </View>

            {/* Event card */}
            <Card style={{ flex: 1, padding: 16 }}>
              <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>
                {item.time}
              </Text>

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 18,
                  fontWeight: "900",
                  color: theme.colors.text,
                }}
              >
                {item.title}
              </Text>

              <Text style={{ marginTop: 8, color: theme.colors.muted, fontWeight: "700" }}>
                {item.location}
              </Text>

              {item.note ? (
                <View
                  style={{
                    marginTop: 12,
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Text style={{ color: theme.colors.muted, fontWeight: "700" }}>
                    {item.note}
                  </Text>
                </View>
              ) : null}
            </Card>
          </View>
        )}
      />

      {/* Floating + button */}
      <View
        style={{
          position: "absolute",
          right: 18,
          bottom: 18 + insets.bottom,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => ({
            width: 58,
            height: 58,
            borderRadius: 999,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.9 : 1,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
          })}
        >
          <Text style={{ color: "white", fontSize: 30, fontWeight: "900", marginTop: -2 }}>
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}