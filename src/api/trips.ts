import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { getUser } from "./users";
import type { TripDoc, TripMember, TripMemberDoc, UserDoc } from "../types/backend";

type CreateTripInput = {
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
};

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in.");
  }
  return uid;
}

function makeInviteCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function getCurrentMemberProfile(uid: string) {
  const authUser = auth.currentUser;
  let userDoc: UserDoc | null = null;
  try {
    userDoc = await getUser(uid);
  } catch {
    userDoc = null;
  }

  return {
    displayName:
      userDoc?.displayName ??
      authUser?.displayName ??
      authUser?.email?.split("@")[0] ??
      "Member",
    email: userDoc?.email ?? authUser?.email ?? "",
    photoURL: userDoc?.photoURL ?? authUser?.photoURL ?? null,
    venmoHandle: userDoc?.venmoHandle ?? null,
  };
}

export async function createTrip({ name, startDate, endDate, timezone }: CreateTripInput) {
  const uid = requireUid();
  const profile = await getCurrentMemberProfile(uid);
  const tripRef = doc(collection(db, "trips"));
  const inviteCode = makeInviteCode();
  const batch = writeBatch(db);

  batch.set(tripRef, {
    name: name.trim(),
    startDate,
    endDate,
    timezone,
    inviteCode,
    createdBy: uid,
    createdAt: serverTimestamp(),
    isArchived: false,
  } as Record<string, unknown>);

  batch.set(doc(db, "trips", tripRef.id, "members", uid), {
    uid,
    role: "admin",
    joinedAt: serverTimestamp(),
    displayName: profile.displayName,
    email: profile.email,
    photoURL: profile.photoURL,
    venmoHandle: profile.venmoHandle,
  } as Record<string, unknown>);

  await batch.commit();
  return { tripId: tripRef.id, inviteCode };
}

export async function deleteTrip(tripId: string) {
  await deleteDoc(doc(db, "trips", tripId));
}

export async function joinTripByInviteCode(code: string) {
  const uid = requireUid();
  const profile = await getCurrentMemberProfile(uid);
  const normalized = code.replace(/\s+/g, "").trim().toUpperCase();
  const q = query(collection(db, "trips"), where("inviteCode", "==", normalized), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("Invite code not found.");
  }

  const tripDoc = snap.docs[0];
  await setDoc(
    doc(db, "trips", tripDoc.id, "members", uid),
    {
      uid,
      role: "member",
      joinedAt: serverTimestamp(),
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      venmoHandle: profile.venmoHandle,
    } as Record<string, unknown>,
    { merge: true }
  );

  return { tripId: tripDoc.id };
}

export async function listMyTrips(uid: string) {
  let tripIds: string[] = [];
  try {
    const userDoc = await getUser(uid);
    if (userDoc?.joinedTripIds?.length) {
      tripIds.push(...userDoc.joinedTripIds);
    }
    if (userDoc?.lastTripId) {
      tripIds.push(userDoc.lastTripId);
    }
  } catch {
    // Fallback to membership-based lookups.
  }

  // Preferred path for new membership docs that include uid.
  if (tripIds.length === 0) {
    try {
      const memberships = await getDocs(query(collectionGroup(db, "members"), where("uid", "==", uid)));
      tripIds = memberships.docs
        .map((membershipDoc) => membershipDoc.ref.parent.parent?.id)
        .filter((tripId): tripId is string => Boolean(tripId));
    } catch {
      tripIds = [];
    }
  }

  // Fallback: scan trips and check member doc directly (supports existing docs without uid field).
  if (tripIds.length === 0) {
    const tripsSnap = await getDocs(collection(db, "trips"));
    const checks = await Promise.all(
      tripsSnap.docs.map(async (tripDoc) => {
        try {
          const memberDoc = await getDoc(doc(db, "trips", tripDoc.id, "members", uid));
          return memberDoc.exists() ? tripDoc.id : null;
        } catch {
          // Ignore trips that this user cannot read membership for.
          return null;
        }
      })
    );
    tripIds = checks.filter((tripId): tripId is string => Boolean(tripId));
  }

  // Additional fallback: include trips created by this user.
  try {
    const createdBySnap = await getDocs(query(collection(db, "trips"), where("createdBy", "==", uid)));
    tripIds.push(...createdBySnap.docs.map((tripDoc) => tripDoc.id));
  } catch {
    // Ignore createdBy lookup errors; membership-based lookups may still succeed.
  }

  const uniqueTripIds = [...new Set(tripIds)];
  if (uniqueTripIds.length === 0) return [];

  const docs = await Promise.all(
    uniqueTripIds.map(async (tripId) => {
      try {
        return await getDoc(doc(db, "trips", tripId));
      } catch {
        return null;
      }
    })
  );
  return docs
    .filter((tripDoc): tripDoc is Exclude<(typeof docs)[number], null> => Boolean(tripDoc && tripDoc.exists()))
    .map((tripDoc) => ({ id: tripDoc.id, ...(tripDoc.data() as TripDoc) }));
}

export async function getTrip(tripId: string) {
  const tripSnap = await getDoc(doc(db, "trips", tripId));
  if (!tripSnap.exists()) return null;
  return { id: tripSnap.id, ...(tripSnap.data() as TripDoc) };
}

export async function listMembers(tripId: string): Promise<TripMember[]> {
  const membershipSnaps = await getDocs(collection(db, "trips", tripId, "members"));
  if (membershipSnaps.empty) return [];

  const memberDocs = membershipSnaps.docs.map((snap) => ({
    ref: snap.ref,
    uid: snap.id,
    ...(snap.data() as TripMemberDoc),
  }));

  const userDocMap = new Map<string, UserDoc>();
  const memberUids = memberDocs.map((member) => member.uid);
  for (const uidChunk of chunk(memberUids, 10)) {
    try {
      const userSnap = await getDocs(query(collection(db, "users"), where(documentId(), "in", uidChunk)));
      userSnap.forEach((snap) => userDocMap.set(snap.id, snap.data() as UserDoc));
    } catch {
      // Some rulesets only allow reading your own user doc.
      // Keep members usable with fallback labels instead of failing the whole request.
    }
  }
  const myUid = auth.currentUser?.uid;
  if (myUid && !userDocMap.has(myUid)) {
    try {
      const me = await getUser(myUid);
      if (me) userDocMap.set(myUid, me);
    } catch {
      // Ignore own-doc fallback failures.
    }
  }

  const profileBackfillBatch = writeBatch(db);
  let backfillCount = 0;
  memberDocs.forEach((member) => {
    const user = userDocMap.get(member.uid);
    if (!user) return;
    const needsBackfill =
      !member.displayName ||
      !member.email ||
      member.photoURL === undefined ||
      (member.venmoHandle === undefined && user.venmoHandle !== undefined);
    if (!needsBackfill) return;
    profileBackfillBatch.set(
      member.ref,
      {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL ?? null,
        venmoHandle: user.venmoHandle ?? null,
      },
      { merge: true }
    );
    backfillCount += 1;
  });
  if (backfillCount > 0) {
    try {
      await profileBackfillBatch.commit();
    } catch {
      // Ignore backfill write failures; listMembers should remain read-first.
    }
  }

  return memberDocs.map((member) => {
    const user = userDocMap.get(member.uid);
    const isMe = member.uid === auth.currentUser?.uid;
    const authName = isMe ? auth.currentUser?.displayName ?? undefined : undefined;
    const authEmail = isMe ? auth.currentUser?.email ?? undefined : undefined;
    const authPhotoURL = isMe ? auth.currentUser?.photoURL ?? undefined : undefined;
    const fallbackName = "Member";
    return {
      uid: member.uid,
      role: member.role,
      joinedAt: member.joinedAt,
      // Prefer the canonical user profile when available; member docs are denormalized snapshots.
      displayName: user?.displayName ?? member.displayName ?? authName ?? fallbackName,
      email: user?.email ?? member.email ?? authEmail ?? "",
      photoURL: user?.photoURL ?? member.photoURL ?? authPhotoURL,
      venmoHandle: user?.venmoHandle ?? member.venmoHandle,
    };
  });
}
