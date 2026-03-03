import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import type { ItineraryItemDoc } from "../types/backend";

type AddItemInput = {
  time?: string;
  title: string;
  locationName?: string;
  locationUrl?: string;
  notes?: string;
};

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function dateRange(start: string, end: string) {
  const days: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  while (current <= endDate) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export async function addItineraryItem(tripId: string, dayId: string, item: AddItemInput) {
  const uid = requireUid();
  const itemRef = doc(collection(db, "trips", tripId, "itinerary", dayId, "items"));
  const payload: Record<string, unknown> = {
    title: item.title.trim(),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const time = item.time?.trim();
  const locationName = item.locationName?.trim();
  const locationUrl = item.locationUrl?.trim();
  const notes = item.notes?.trim();

  if (time) payload.time = time;
  if (locationName) payload.locationName = locationName;
  if (locationUrl) payload.locationUrl = locationUrl;
  if (notes) payload.notes = notes;

  await setDoc(itemRef, payload);
  return itemRef.id;
}

export async function listItineraryItems(tripId: string, dayId: string) {
  const snap = await getDocs(
    query(collection(db, "trips", tripId, "itinerary", dayId, "items"), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((itemDoc) => ({
    id: itemDoc.id,
    dayId,
    ...(itemDoc.data() as ItineraryItemDoc),
  }));
}

export async function updateItineraryItem(
  tripId: string,
  dayId: string,
  itemId: string,
  patch: Partial<Omit<ItineraryItemDoc, "createdBy" | "createdAt" | "updatedAt">>
) {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.time !== undefined) payload.time = patch.time?.trim() || null;
  if (patch.locationName !== undefined) payload.locationName = patch.locationName?.trim() || null;
  if (patch.locationUrl !== undefined) payload.locationUrl = patch.locationUrl?.trim() || null;
  if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null;

  await updateDoc(doc(db, "trips", tripId, "itinerary", dayId, "items", itemId), payload);
}

export async function deleteItineraryItem(tripId: string, dayId: string, itemId: string) {
  await deleteDoc(doc(db, "trips", tripId, "itinerary", dayId, "items", itemId));
}

export async function listRecentItineraryItems(tripId: string, startDate: string, endDate: string, topN = 8) {
  const dayIds = dateRange(startDate, endDate);
  const rows: Array<{ id: string; dayId: string; createdAtMs: number; title: string; createdBy: string }> = [];

  for (const dayId of dayIds) {
    const items = await listItineraryItems(tripId, dayId);
    items.forEach((item) => {
      rows.push({
        id: item.id,
        dayId,
        createdAtMs: item.createdAt?.toMillis?.() ?? 0,
        title: item.title,
        createdBy: item.createdBy,
      });
    });
  }

  return rows.sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, topN);
}
