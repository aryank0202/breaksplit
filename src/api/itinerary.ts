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
  await setDoc(itemRef, {
    time: item.time?.trim() || undefined,
    title: item.title.trim(),
    locationName: item.locationName?.trim() || undefined,
    locationUrl: item.locationUrl?.trim() || undefined,
    notes: item.notes?.trim() || undefined,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } satisfies Omit<ItineraryItemDoc, "createdAt" | "updatedAt"> & {
    createdAt: unknown;
    updatedAt: unknown;
  });
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
  await updateDoc(doc(db, "trips", tripId, "itinerary", dayId, "items", itemId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItineraryItem(tripId: string, dayId: string, itemId: string) {
  await deleteDoc(doc(db, "trips", tripId, "itinerary", dayId, "items", itemId));
}

export async function listRecentItineraryItems(tripId: string, startDate: string, endDate: string, topN = 8) {
  const dayIds = dateRange(startDate, endDate);
  const rows: Array<{ id: string; dayId: string; createdAtMs: number; title: string }> = [];

  for (const dayId of dayIds) {
    const items = await listItineraryItems(tripId, dayId);
    items.forEach((item) => {
      rows.push({
        id: item.id,
        dayId,
        createdAtMs: item.createdAt?.toMillis?.() ?? 0,
        title: item.title,
      });
    });
  }

  return rows.sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, topN);
}
