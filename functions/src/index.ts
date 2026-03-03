import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

initializeApp();

type UserProfile = {
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  venmoHandle?: string | null;
};

function hasRelevantChange(before: UserProfile | undefined, after: UserProfile | undefined) {
  return (
    (before?.displayName ?? "") !== (after?.displayName ?? "") ||
    (before?.email ?? "") !== (after?.email ?? "") ||
    (before?.photoURL ?? null) !== (after?.photoURL ?? null) ||
    (before?.venmoHandle ?? null) !== (after?.venmoHandle ?? null)
  );
}

function toMemberPatch(profile: UserProfile) {
  return {
    displayName: profile.displayName ?? "Member",
    email: profile.email ?? "",
    photoURL: profile.photoURL ?? null,
    venmoHandle: profile.venmoHandle ?? null,
  };
}

async function commitInChunks(refs: FirebaseFirestore.DocumentReference[], patch: Record<string, unknown>) {
  const db = getFirestore();
  const chunkSize = 450;
  for (let i = 0; i < refs.length; i += chunkSize) {
    const chunk = refs.slice(i, i + chunkSize);
    const batch = db.batch();
    chunk.forEach((ref) => batch.set(ref, patch, { merge: true }));
    await batch.commit();
  }
}

export const propagateUserProfileToMembers = onDocumentWritten(
  {
    document: "users/{uid}",
    region: "us-central1",
  },
  async (event) => {
    const uid = event.params.uid as string;
    const before = event.data?.before.data() as UserProfile | undefined;
    const after = event.data?.after.data() as UserProfile | undefined;

    if (!after) {
      logger.info("User doc deleted; skipping member propagation", { uid });
      return;
    }
    if (!hasRelevantChange(before, after)) {
      return;
    }

    const db = getFirestore();
    const memberSnap = await db.collectionGroup("members").where("uid", "==", uid).get();
    if (memberSnap.empty) {
      logger.info("No member docs to propagate", { uid });
      return;
    }

    const patch = toMemberPatch(after);
    await commitInChunks(memberSnap.docs.map((doc) => doc.ref), patch);

    logger.info("Propagated user profile to member docs", {
      uid,
      count: memberSnap.size,
    });
  }
);
