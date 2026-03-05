import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import type { ExpenseDoc, SplitDoc } from "../types/backend";
import { splitCustom, splitEqual, splitPercent } from "../utils/split";

type CreateExpenseInput = {
  title: string;
  amountCents: number;
  payerUid: string;
  participantUids: string[];
  splitType: "equal" | "custom" | "percent";
  note?: string;
  customSplits?: Record<string, number>;
};

export type ListedExpense = {
  id: string;
  title: string;
  amountCents: number;
  currency: "USD";
  payerUid: string;
  participantUids: string[];
  splitType: "equal" | "custom" | "percent";
  note?: string;
  createdBy: string;
  createdAtMs: number;
  myShareCents: number;
  mySplitState: "unpaid" | "marked_paid" | "confirmed" | "none";
  statusLabel: "Unpaid" | "Paid/Confirmed" | "Collecting";
  collectingCents: number;
};

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function buildSplitMap(input: CreateExpenseInput) {
  if (input.splitType === "equal") {
    return splitEqual(input.amountCents, input.participantUids);
  }
  if (input.splitType === "custom") {
    return splitCustom(input.amountCents, input.customSplits ?? {});
  }
  return splitPercent(input.amountCents, input.customSplits ?? {});
}

export async function createExpense(tripId: string, input: CreateExpenseInput) {
  const createdBy = requireUid();
  const splitMap = buildSplitMap(input);
  const expenseRef = doc(collection(db, "trips", tripId, "expenses"));
  const batch = writeBatch(db);
  const note = input.note?.trim();
  const expensePayload: Record<string, unknown> = {
    title: input.title.trim(),
    amountCents: input.amountCents,
    currency: "USD",
    payerUid: input.payerUid,
    participantUids: input.participantUids,
    splitType: input.splitType,
    createdBy,
    createdAt: serverTimestamp(),
  };
  if (note) expensePayload.note = note;

  batch.set(expenseRef, expensePayload);

  Object.entries(splitMap).forEach(([uid, owedCents]) => {
    const isPayer = uid === input.payerUid;
    batch.set(doc(db, "trips", tripId, "expenses", expenseRef.id, "splits", uid), {
      owedCents,
      paidCents: isPayer ? owedCents : 0,
      state: isPayer ? "confirmed" : "unpaid",
      updatedAt: serverTimestamp(),
      confirmedAt: isPayer ? serverTimestamp() : null,
      markedPaidAt: null,
    } as Record<string, unknown>);
  });

  await batch.commit();
  return expenseRef.id;
}

export async function markMySplitPaid(tripId: string, expenseId: string, uid: string) {
  const splitRef = doc(db, "trips", tripId, "expenses", expenseId, "splits", uid);
  const splitSnap = await getDoc(splitRef);
  const owedCents = (splitSnap.data() as SplitDoc | undefined)?.owedCents ?? 0;

  await updateDoc(splitRef, {
    state: "confirmed",
    paidCents: owedCents,
    markedPaidAt: serverTimestamp(),
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function confirmSplitPaid(tripId: string, expenseId: string, uid: string) {
  const splitRef = doc(db, "trips", tripId, "expenses", expenseId, "splits", uid);
  const splitSnap = await getDoc(splitRef);
  const owedCents = (splitSnap.data() as SplitDoc | undefined)?.owedCents ?? 0;
  await updateDoc(splitRef, {
    state: "confirmed",
    confirmedAt: serverTimestamp(),
    paidCents: owedCents,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExpense(tripId: string, expenseId: string) {
  const uid = requireUid();
  const expenseRef = doc(db, "trips", tripId, "expenses", expenseId);
  const expenseSnap = await getDoc(expenseRef);
  if (!expenseSnap.exists()) {
    throw new Error("Expense not found.");
  }
  const expense = expenseSnap.data() as ExpenseDoc;
  if (expense.createdBy !== uid) {
    throw new Error("Only the expense creator can delete this expense.");
  }

  const splitSnap = await getDocs(collection(db, "trips", tripId, "expenses", expenseId, "splits"));
  const batch = writeBatch(db);
  splitSnap.forEach((snap) => batch.delete(snap.ref));
  batch.delete(expenseRef);
  await batch.commit();
}

async function listSplitsForExpense(tripId: string, expenseId: string) {
  const splitSnap = await getDocs(collection(db, "trips", tripId, "expenses", expenseId, "splits"));
  return splitSnap.docs.map((snap) => ({ uid: snap.id, ...(snap.data() as SplitDoc) }));
}

export async function listExpenseSplits(tripId: string, expenseId: string) {
  return listSplitsForExpense(tripId, expenseId);
}

export async function listExpenses(tripId: string): Promise<ListedExpense[]> {
  const currentUid = requireUid();
  const expenseSnap = await getDocs(
    query(collection(db, "trips", tripId, "expenses"), orderBy("createdAt", "desc"))
  );

  const rows: ListedExpense[] = [];
  for (const expenseDoc of expenseSnap.docs) {
    const expense = expenseDoc.data() as ExpenseDoc;
    const splits = await listSplitsForExpense(tripId, expenseDoc.id);
    const mySplit = splits.find((split) => split.uid === currentUid);
    const collectingCents =
      expense.payerUid === currentUid
        ? splits
            .filter((split) => split.uid !== currentUid && split.state !== "confirmed")
            .reduce((sum, split) => sum + split.owedCents, 0)
        : 0;

    let statusLabel: ListedExpense["statusLabel"] = "Unpaid";
    if (expense.payerUid === currentUid && collectingCents > 0) {
      statusLabel = "Collecting";
    } else if (mySplit?.state === "marked_paid" || mySplit?.state === "confirmed" || expense.payerUid === currentUid) {
      statusLabel = "Paid/Confirmed";
    }

    rows.push({
      id: expenseDoc.id,
      title: expense.title,
      amountCents: expense.amountCents,
      currency: expense.currency,
      payerUid: expense.payerUid,
      participantUids: expense.participantUids,
      splitType: expense.splitType,
      note: expense.note,
      createdBy: expense.createdBy,
      createdAtMs: expense.createdAt?.toMillis?.() ?? 0,
      myShareCents: mySplit?.owedCents ?? 0,
      mySplitState: mySplit?.state ?? "none",
      statusLabel,
      collectingCents,
    });
  }

  return rows;
}

export async function computeTotals(tripId: string, uid: string) {
  const expenseSnap = await getDocs(collection(db, "trips", tripId, "expenses"));
  let youOweCents = 0;
  let youreOwedCents = 0;

  for (const expenseDoc of expenseSnap.docs) {
    const expense = expenseDoc.data() as ExpenseDoc;
    const splitSnap = await getDocs(collection(db, "trips", tripId, "expenses", expenseDoc.id, "splits"));
    const splits = splitSnap.docs.map((snap) => ({ uid: snap.id, ...(snap.data() as SplitDoc) }));

    if (expense.payerUid === uid) {
      youreOwedCents += splits
        .filter((split) => split.uid !== uid && split.state !== "confirmed")
        .reduce((sum, split) => sum + split.owedCents, 0);
    }

    const mine = splits.find((split) => split.uid === uid);
    if (mine && expense.payerUid !== uid && mine.state === "unpaid") {
      youOweCents += mine.owedCents;
    }
  }

  return { youOweCents, youreOwedCents };
}
