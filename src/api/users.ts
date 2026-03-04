import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import * as FileSystem from "expo-file-system/legacy";
import { app, auth, db, storageBucketCandidates } from "../firebase";
import type { UserDoc } from "../types/backend";

type UpsertPayload = {
  displayName: string;
  venmoHandle?: string;
  email?: string;
  photoURL?: string;
};

async function listCandidateTripIdsForUser(uid: string, existingUserDoc: UserDoc | null) {
  const tripIds = new Set<string>();
  if (existingUserDoc?.joinedTripIds?.length) {
    existingUserDoc.joinedTripIds.forEach((tripId) => tripIds.add(tripId));
  }
  if (existingUserDoc?.lastTripId) {
    tripIds.add(existingUserDoc.lastTripId);
  }

  // Include trips created by this user in case joinedTripIds was never backfilled.
  try {
    const createdTripsSnap = await getDocs(query(collection(db, "trips"), where("createdBy", "==", uid)));
    createdTripsSnap.forEach((tripDoc) => tripIds.add(tripDoc.id));
  } catch {
    // Best effort only; primary propagation path uses known trip IDs.
  }

  return Array.from(tripIds);
}

export async function upsertUserProfile(uid: string, payload: UpsertPayload) {
  const ref = doc(db, "users", uid);
  const existing = await getDoc(ref);
  const existingUserDoc = existing.exists() ? (existing.data() as UserDoc) : null;

  const nextData: Record<string, unknown> = {
    displayName: payload.displayName.trim(),
    email: payload.email ?? auth.currentUser?.email ?? "",
  };
  if (payload.photoURL !== undefined) nextData.photoURL = payload.photoURL;
  const venmoHandle = payload.venmoHandle?.trim();
  if (venmoHandle) nextData.venmoHandle = venmoHandle;

  if (!existing.exists()) {
    nextData.createdAt = serverTimestamp();
  }

  await setDoc(ref, nextData, { merge: true });

  // Spark-compatible propagation: write to this user's member snapshots across known trips.
  try {
    const tripIds = await listCandidateTripIdsForUser(uid, existingUserDoc);
    if (tripIds.length > 0) {
      const updates = tripIds.map(async (tripId) => {
        await setDoc(
          doc(db, "trips", tripId, "members", uid),
          {
            uid,
            displayName: nextData.displayName,
            email: nextData.email,
            photoURL: payload.photoURL ?? null,
          },
          { merge: true }
        );
      });
      const settled = await Promise.allSettled(updates);
      const nonPermissionFailures = settled.filter(
        (result) =>
          result.status === "rejected" &&
          !String((result.reason as any)?.code ?? "").includes("permission-denied")
      );
      if (nonPermissionFailures.length > 0) {
        throw (nonPermissionFailures[0] as PromiseRejectedResult).reason;
      }
    }
  } catch (error: any) {
    const code = String(error?.code ?? "");
    if (!code.includes("permission-denied")) {
      throw error;
    }
    // Some trip membership docs may not be writable due to rules/state drift.
    // The primary user profile write above has already succeeded.
    console.warn("Skipping member snapshot sync due to Firestore rules:", error?.message ?? error);
  }
}

export async function getUser(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as UserDoc) };
}

export async function setUserLastTrip(uid: string, tripId: string) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { lastTripId: tripId }, { merge: true });
}

export async function addUserTrip(uid: string, tripId: string) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      lastTripId: tripId,
      joinedTripIds: arrayUnion(tripId),
    },
    { merge: true }
  );
}

export async function uploadProfilePhoto(uid: string, localUri: string, base64Data?: string | null) {
  const bucketUrls = storageBucketCandidates.map((bucket) => `gs://${bucket}`);
  const storages = bucketUrls.length > 0 ? bucketUrls.map((url) => getStorage(app, url)) : [getStorage(app)];
  const resolvedBase64 =
    base64Data ?? (await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 }));

  const attempts: string[] = [];
  for (let index = 0; index < storages.length; index += 1) {
    const storage = storages[index];
    const bucketUrl = bucketUrls[index] ?? "default";
    const fileRef = ref(storage, `profilePhotos/${uid}/${Date.now()}.jpg`);
    try {
      await uploadString(fileRef, resolvedBase64, "base64", { contentType: "image/jpeg" });
      return getDownloadURL(fileRef);
    } catch (error: any) {
      const code = error?.code ? String(error.code) : "storage/unknown";
      const server = error?.customData?.serverResponse ? String(error.customData.serverResponse) : "";
      const detail = server ? `${code}: ${server}` : `${code}: ${String(error?.message ?? "no-message")}`;
      attempts.push(`${bucketUrl} -> ${detail}`);
    }
  }

  const attemptInfo = attempts.length > 0 ? attempts.join(" | ") : "no upload attempts";
  throw new Error(`Profile photo upload failed (${attemptInfo}).`);
}

export async function deleteUserProfileDoc(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}
