import React, { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import { useTrip } from "../state/TripStore";

type TimelineItem = {
  id: string;
  time: string;
  title: string;
  location: string;
  note?: string;
};

const fallbackTimeline: TimelineItem[] = [
  {
    id: "a1",
    time: "10:00 AM",
    title: "Arrival & Check-in",
    location: "The Setai Miami Beach",
    note: "Front desk confirmation #2847",
  },
  {
    id: "a2",
    time: "2:00 PM",
    title: "Lunch at Joe's Stone Crab",
    location: "11 Washington Ave",
  },
  {
    id: "a3",
    time: "7:00 PM",
    title: "Sunset at South Beach",
    location: "Ocean Drive",
    note: "Bring cameras!",
  },
];

const dayTabs = ["Day 1", "Day 2", "Day 3", "Day 4"];

function dateForTripDay(dayIndex: number) {
  const base = new Date(2026, 2, 8); // March 8, 2026
  const current = new Date(base);
  current.setDate(base.getDate() + dayIndex);
  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, "0");
  const dd = String(current.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeTime(value?: string) {
  if (!value || !value.trim()) return "TBD";
  return value.trim();
}

export default function ItineraryDayScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { state, addItinerary } = useTrip();
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const selectedDate = useMemo(() => dateForTripDay(selectedDay), [selectedDay]);
  const canSave = newTitle.trim().length > 0;

  const timelineItems = useMemo(() => {
    const fromStore = state.itinerary
      .filter((item) => item.date === selectedDate)
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
      .map((item) => ({
        id: item.id,
        time: normalizeTime(item.time),
        title: item.title,
        location: item.location ?? "No location",
        note: item.description,
      }));

    return fromStore.length > 0 ? fromStore : selectedDay === 0 ? fallbackTimeline : [];
  }, [selectedDate, selectedDay, state.itinerary]);

  function resetModalForm() {
    setNewTime("");
    setNewTitle("");
    setNewLocation("");
    setNewNotes("");
  }

  function closeModal() {
    setShowAddModal(false);
    resetModalForm();
  }

  function onAddEvent() {
    if (!canSave) return;

    addItinerary({
      title: newTitle.trim(),
      time: newTime.trim() || undefined,
      location: newLocation.trim() || undefined,
      description: newNotes.trim() || undefined,
      date: selectedDate,
    });

    closeModal();
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={theme.colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Itinerary</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
          {dayTabs.map((day, index) => {
            const active = selectedDay === index;
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(index)}
                style={[styles.dayPill, active ? styles.dayPillActive : styles.dayPillInactive]}
              >
                <Text style={[styles.dayLabel, active ? styles.dayLabelActive : styles.dayLabelInactive]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.scrollTrack}>
          <View style={[styles.scrollThumb, { width: `${((selectedDay + 1) / dayTabs.length) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.timelineContent}>
        {timelineItems.length === 0 ? (
          <Text style={styles.emptyText}>No itinerary items for this day yet.</Text>
        ) : null}

        {timelineItems.map((item) => (
          <View key={item.id} style={styles.timelineRow}>
            <View style={styles.railWrap}>
              <View style={styles.railDot} />
              <View style={styles.railLine} />
            </View>

            <View style={styles.eventCard}>
              <View style={styles.metaRow}>
                <Feather name="clock" size={15} color="#94A3B8" />
                <Text style={styles.timeText}>{item.time}</Text>
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>

              <View style={[styles.metaRow, { marginTop: 8 }]}>
                <Feather name="map-pin" size={15} color="#94A3B8" />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>

              {item.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>{item.note}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={() => setShowAddModal(true)} style={[styles.fab, { bottom: insets.bottom + 18 }]}>
        <Feather name="plus" size={28} color="white" />
      </Pressable>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <Pressable onPress={closeModal} style={styles.closeCircle}>
                <Feather name="x" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.dayBadge}>
              <Feather name="calendar" size={14} color={theme.colors.primary} />
              <Text style={styles.dayBadgeText}>Adding to {dayTabs[selectedDay]}</Text>
            </View>

            <Text style={styles.fieldLabel}>Time</Text>
            <View style={styles.inputShell}>
              <Feather name="clock" size={18} color="#9CA3AF" />
              <TextInput
                value={newTime}
                onChangeText={setNewTime}
                placeholder="--:-- --"
                placeholderTextColor="#9CA3AF"
                style={styles.inputText}
              />
            </View>

            <Text style={styles.fieldLabel}>Event Title</Text>
            <View style={styles.inputShell}>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g., Lunch at Ocean Drive"
                placeholderTextColor="#9CA3AF"
                style={styles.inputText}
              />
            </View>

            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.inputShell}>
              <Feather name="map-pin" size={18} color="#9CA3AF" />
              <TextInput
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="e.g., South Beach"
                placeholderTextColor="#9CA3AF"
                style={styles.inputText}
              />
            </View>

            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
            <View style={[styles.inputShell, styles.notesShell]}>
              <TextInput
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder="Add any additional details..."
                placeholderTextColor="#9CA3AF"
                style={[styles.inputText, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </View>

            <Pressable
              onPress={onAddEvent}
              disabled={!canSave}
              style={[styles.primaryModalButton, !canSave ? styles.primaryModalButtonDisabled : null]}
            >
              <Text style={[styles.primaryModalButtonText, !canSave ? styles.primaryModalButtonTextDisabled : null]}>
                Add Event
              </Text>
            </Pressable>

            <Pressable onPress={closeModal} style={styles.secondaryModalButton}>
              <Text style={styles.secondaryModalButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 35,
    fontWeight: "900",
    color: "#111827",
  },
  dayTabs: {
    gap: 10,
    paddingRight: 24,
  },
  dayPill: {
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillActive: {
    backgroundColor: theme.colors.primary,
  },
  dayPillInactive: {
    backgroundColor: "#E5E7EB",
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  dayLabelActive: {
    color: "white",
  },
  dayLabelInactive: {
    color: "#475569",
  },
  scrollTrack: {
    marginTop: 8,
    height: 6,
    backgroundColor: "#3F3F46",
    borderRadius: 3,
    overflow: "hidden",
  },
  scrollThumb: {
    height: 6,
    backgroundColor: "#71717A",
    borderRadius: 3,
  },
  timelineContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 110,
    gap: 14,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  railWrap: {
    width: 22,
    alignItems: "center",
  },
  railDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginTop: 7,
  },
  railLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    backgroundColor: "#CBD5E1",
  },
  eventCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    color: "#64748B",
    fontWeight: "500",
    fontSize: 16,
  },
  eventTitle: {
    marginTop: 8,
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "800",
  },
  locationText: {
    color: "#475569",
    fontSize: 14,
  },
  noteBox: {
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteText: {
    color: "#64748B",
    fontSize: 13,
  },
  emptyText: {
    marginHorizontal: 20,
    color: "#64748B",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: "#1F2937",
    fontSize: 34,
    fontWeight: "800",
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadge: {
    marginTop: 14,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  dayBadgeText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
  },
  inputShell: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputText: {
    flex: 1,
    color: "#1F2937",
    fontSize: 14,
    paddingVertical: 0,
  },
  notesShell: {
    minHeight: 92,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  notesInput: {
    minHeight: 64,
  },
  primaryModalButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryModalButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  primaryModalButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  primaryModalButtonTextDisabled: {
    color: "#94A3B8",
  },
  secondaryModalButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryModalButtonText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
  },
});
