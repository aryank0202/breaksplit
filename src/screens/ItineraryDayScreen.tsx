import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Convert date string (YYYY-MM-DD) to Date object for picker
  function stringToDate(dateStr: string): Date {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  }

  // Convert Date object back to YYYY-MM-DD string
  function dateToString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function handleDateChange(event: any, selectedDate: Date | undefined) {
    if (selectedDate) {
      setDate(dateToString(selectedDate));
    }
    setShowDatePicker(false);
  }

  // Validate time input: only allow digits, colons, and spaces (for AM/PM)
  function handleTimeChange(input: string) {
    const filtered = input.replace(/[^0-9:APMapm ]/g, "");
    setTime(filtered);
  }

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
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={({ pressed }) => ({
                  marginTop: 10,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  backgroundColor: pressed ? "#f0f0f0" : "transparent",
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.colors.text }}>
                  {date}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={stringToDate(date)}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              )}
            </View>

            <View style={{ width: 120 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.muted }}>Time</Text>
              <TextInput
                value={time}
                onChangeText={handleTimeChange}
                placeholder="7:00 PM"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
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