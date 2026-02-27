import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import Card from "../components/Card";
import Row from "../components/Row";
import { useTrip } from "../state/TripStore";

export default function AddItineraryItemScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { addItinerary, state } = useTrip();

  // default date: today in trip context or passed in
  const defaultDate = route?.params?.date ?? new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState(""); // "7:00 PM" or "19:00" (we'll keep free-form for now)
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);

  const canSave = useMemo(() => title.trim().length > 0 && date.trim().length > 0, [title, date]);

  function onSave() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter an activity title.");
      return;
    }
    if (!date.trim()) {
      Alert.alert("Missing date", "Please enter a date (YYYY-MM-DD).");
      return;
    }

    addItinerary({
      title: title.trim(),
      location: location.trim() || undefined,
      time: time.trim() || undefined,
      description: description.trim() || undefined,
      date: date.trim(),
    });

    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 14, paddingBottom: 10 }}>
        <Row style={{ gap: 10, alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({ padding: 10, borderRadius: 12, opacity: pressed ? 0.9 : 1 })}
          >
            <Text style={{ fontSize: 18, fontWeight: "900", color: theme.colors.primary }}>‹</Text>
          </Pressable>

          <Text style={{ fontSize: 22, fontWeight: "900", color: theme.colors.text }}>
            Add Itinerary Item
          </Text>
        </Row>
      </View>

      <View style={{ padding: 20, gap: 14 }}>
        <Card>
          <Text style={{ fontWeight: "900", color: theme.colors.muted }}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Lunch at Joe's"
            placeholderTextColor="#9CA3AF"
            style={{ marginTop: 10, fontSize: 16, fontWeight: "800", color: theme.colors.text }}
          />
        </Card>

        <Card>
          <Row style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.muted }}>Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="MM-DD-YYYY"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                style={{ marginTop: 10, fontSize: 16, fontWeight: "800", color: theme.colors.text }}
              />
            </View>

            <View style={{ width: 120 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.muted }}>Time</Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="7:00 PM"
                placeholderTextColor="#9CA3AF"
                style={{ marginTop: 10, fontSize: 16, fontWeight: "800", color: theme.colors.text }}
              />
            </View>
          </Row>
        </Card>

        <Card>
          <Text style={{ fontWeight: "900", color: theme.colors.muted }}>Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., South Beach"
            placeholderTextColor="#9CA3AF"
            style={{ marginTop: 10, fontSize: 16, fontWeight: "800", color: theme.colors.text }}
          />
        </Card>

        <Card>
          <Text style={{ fontWeight: "900", color: theme.colors.muted }}>Notes</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional details..."
            placeholderTextColor="#9CA3AF"
            multiline
            style={{
              marginTop: 10,
              minHeight: 90,
              fontSize: 15,
              fontWeight: "700",
              color: theme.colors.text,
            }}
          />
        </Card>
      </View>

      {/* Save button */}
      <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 + insets.bottom }}>
        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={({ pressed }) => ({
            backgroundColor: canSave ? theme.colors.primary : "#CBD5E1",
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}