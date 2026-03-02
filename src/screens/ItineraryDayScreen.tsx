import React, { useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import {
  addItineraryItem,
  deleteItineraryItem,
  listItineraryItems,
  updateItineraryItem,
} from "../api/itinerary";

type TimelineItem = {
  id: string;
  time?: string;
  title: string;
  locationName?: string;
  notes?: string;
  createdAtMs: number;
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayRange(startDate: string, endDate: string) {
  const out: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const current = new Date(start);
  while (current <= end) {
    out.push(toIsoDate(current));
    current.setDate(current.getDate() + 1);
  }
  return out;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function parseTimeStringToDate(value?: string) {
  if (!value) return null;
  const match = value.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3];
  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function timeToMinutes(value?: string) {
  const parsed = parseTimeStringToDate(value);
  if (!parsed) return Number.MAX_SAFE_INTEGER;
  return parsed.getHours() * 60 + parsed.getMinutes();
}

export default function ItineraryDayScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { selectedTripId, selectedTrip } = useTrip();
  const dayIds = useMemo(() => {
    if (!selectedTrip) return [toIsoDate(new Date())];
    return dayRange(selectedTrip.startDate, selectedTrip.endDate);
  }, [selectedTrip]);

  const [selectedDay, setSelectedDay] = useState(0);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<Date | null>(null);
  const [draftTime, setDraftTime] = useState<Date>(new Date());
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const selectedDayId = dayIds[Math.min(selectedDay, dayIds.length - 1)];
  const canSave = newTitle.trim().length > 0;

  async function loadItems() {
    if (!selectedTripId || !selectedDayId) return;
    try {
      setLoading(true);
      const rows = await listItineraryItems(selectedTripId, selectedDayId);
      const normalized = rows
        .map((row) => ({
          id: row.id,
          time: row.time,
          title: row.title,
          locationName: row.locationName,
          notes: row.notes,
          createdAtMs: row.createdAt?.toMillis?.() ?? 0,
        }))
        .sort((a, b) => {
          const aTime = timeToMinutes(a.time);
          const bTime = timeToMinutes(b.time);
          if (aTime !== bTime) return aTime - bTime;
          return a.createdAtMs - b.createdAtMs;
        });
      setItems(normalized);
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Could not load itinerary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, [selectedDayId, selectedTripId]);

  function resetForm() {
    setEditingItemId(null);
    setNewTime(null);
    setDraftTime(new Date());
    setShowTimePicker(false);
    setNewTitle("");
    setNewLocation("");
    setNewNotes("");
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  function onStartAdd() {
    resetForm();
    setShowModal(true);
  }

  function onStartEdit(item: TimelineItem) {
    setEditingItemId(item.id);
    const parsed = parseTimeStringToDate(item.time);
    setNewTime(parsed);
    setDraftTime(parsed ?? new Date());
    setNewTitle(item.title);
    setNewLocation(item.locationName ?? "");
    setNewNotes(item.notes ?? "");
    setShowModal(true);
  }

  async function onSave() {
    if (!selectedTripId || !selectedDayId || !canSave) return;
    try {
      if (editingItemId) {
        await updateItineraryItem(selectedTripId, selectedDayId, editingItemId, {
          time: newTime ? formatTime(newTime) : undefined,
          title: newTitle.trim(),
          locationName: newLocation.trim() || undefined,
          notes: newNotes.trim() || undefined,
        });
      } else {
        await addItineraryItem(selectedTripId, selectedDayId, {
          time: newTime ? formatTime(newTime) : undefined,
          title: newTitle.trim(),
          locationName: newLocation.trim() || undefined,
          notes: newNotes.trim() || undefined,
        });
      }
      closeModal();
      await loadItems();
    } catch (error: any) {
      Alert.alert("Save failed", error?.message ?? "Could not save itinerary item.");
    }
  }

  async function onDelete(itemId: string) {
    if (!selectedTripId || !selectedDayId) return;
    try {
      await deleteItineraryItem(selectedTripId, selectedDayId, itemId);
      await loadItems();
    } catch (error: any) {
      Alert.alert("Delete failed", error?.message ?? "Could not delete itinerary item.");
    }
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
          {dayIds.map((dayId, index) => {
            const active = selectedDay === index;
            return (
              <Pressable
                key={dayId}
                onPress={() => setSelectedDay(index)}
                style={[styles.dayPill, active ? styles.dayPillActive : styles.dayPillInactive]}
              >
                <Text style={[styles.dayLabel, active ? styles.dayLabelActive : styles.dayLabelInactive]}>
                  Day {index + 1}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.timelineContent}>
        {loading ? <Text style={styles.emptyText}>Loading...</Text> : null}
        {!loading && items.length === 0 ? <Text style={styles.emptyText}>No itinerary items for this day yet.</Text> : null}

        {items.map((item) => (
          <View key={item.id} style={styles.timelineRow}>
            <View style={styles.railWrap}>
              <View style={styles.railDot} />
              <View style={styles.railLine} />
            </View>
            <View style={styles.eventCard}>
              <View style={styles.eventTopRow}>
                <View style={styles.metaRow}>
                  <Feather name="clock" size={15} color="#94A3B8" />
                  <Text style={styles.timeText}>{item.time || "TBD"}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Pressable onPress={() => onStartEdit(item)} hitSlop={8} style={styles.editButton}>
                    <Feather name="edit-2" size={14} color="#2563EB" />
                  </Pressable>
                  <Pressable onPress={() => onDelete(item.id)} hitSlop={8} style={styles.deleteButton}>
                    <Feather name="trash-2" size={15} color="#EF4444" />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>
              <View style={[styles.metaRow, { marginTop: 8 }]}>
                <Feather name="map-pin" size={15} color="#94A3B8" />
                <Text style={styles.locationText}>{item.locationName || "No location"}</Text>
              </View>

              {item.notes ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>{item.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={onStartAdd} style={[styles.fab, { bottom: insets.bottom + 18 }]}>
        <Feather name="plus" size={28} color="white" />
      </Pressable>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{editingItemId ? "Edit Event" : "Add Event"}</Text>
                <Pressable onPress={closeModal} style={styles.closeCircle}>
                  <Feather name="x" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>Time (optional)</Text>
              <Pressable
                style={styles.inputShell}
                onPress={() => {
                  setDraftTime(newTime ?? new Date());
                  setShowTimePicker(true);
                }}
              >
                <Feather name="clock" size={18} color="#9CA3AF" />
                <Text style={[styles.inputText, !newTime ? styles.placeholderText : null]}>
                  {newTime ? formatTime(newTime) : "Select time"}
                </Text>
              </Pressable>
              {showTimePicker ? (
                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    value={draftTime}
                    mode="time"
                    display="spinner"
                    textColor="#111827"
                    themeVariant="light"
                    onChange={(_, selected) => {
                      if (selected) setDraftTime(selected);
                    }}
                  />
                  <View style={styles.pickerActions}>
                    <Pressable onPress={() => setShowTimePicker(false)} style={styles.pickerActionButton}>
                      <Text style={styles.pickerActionText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setNewTime(draftTime);
                        setShowTimePicker(false);
                      }}
                      style={styles.pickerActionButton}
                    >
                      <Text style={[styles.pickerActionText, { color: theme.colors.primary }]}>Set Time</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

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
                  placeholder="Add details..."
                  placeholderTextColor="#9CA3AF"
                  style={[styles.inputText, styles.notesInput]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                onPress={onSave}
                disabled={!canSave}
                style={[styles.primaryModalButton, !canSave ? styles.primaryModalButtonDisabled : null]}
              >
                <Text style={[styles.primaryModalButtonText, !canSave ? styles.primaryModalButtonTextDisabled : null]}>
                  {editingItemId ? "Save Changes" : "Add Event"}
                </Text>
              </Pressable>

              <Pressable onPress={closeModal} style={styles.secondaryModalButton}>
                <Text style={styles.secondaryModalButtonText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    alignItems: "center",
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
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
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
    maxHeight: "92%",
  },
  modalContent: {
    paddingBottom: 4,
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
  placeholderText: {
    color: "#9CA3AF",
  },
  pickerWrap: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    overflow: "hidden",
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  pickerActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pickerActionText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
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
