import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { UserDoc } from "../types/backend";

type UpsertPayload = {
  displayName: string;
  venmoHandle?: string;
  email?: string;
};

export async function upsertUserProfile(uid: string, payload: UpsertPayload) {
  const ref = doc(db, "users", uid);
  const existing = await getDoc(ref);

  const nextData: Record<string, unknown> = {
    displayName: payload.displayName.trim(),
    venmoHandle: payload.venmoHandle?.trim() || undefined,
    email: payload.email ?? auth.currentUser?.email ?? "",
  };

  if (!existing.exists()) {
    nextData.createdAt = serverTimestamp();
  }

  await setDoc(ref, nextData, { merge: true });
}

export async function getUser(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as UserDoc) };
}
