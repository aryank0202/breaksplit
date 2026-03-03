import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";
import {
  arrayUnion,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
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

export async function upsertUserProfile(uid: string, payload: UpsertPayload) {
  const ref = doc(db, "users", uid);
  const existing = await getDoc(ref);

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

  // Keep trip membership snapshots in sync so names/photos are readable without user-doc access.
  const memberships = await getDocs(query(collectionGroup(db, "members"), where("uid", "==", uid)));
  if (!memberships.empty) {
    const batch = writeBatch(db);
    memberships.forEach((membershipDoc) => {
      batch.set(
        membershipDoc.ref,
        {
          displayName: nextData.displayName,
          email: nextData.email,
          photoURL: payload.photoURL ?? null,
        },
        { merge: true }
      );
    });
    await batch.commit();
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
