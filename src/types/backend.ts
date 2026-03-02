import type { Timestamp } from "firebase/firestore";

export type UserDoc = {
  displayName: string;
  email: string;
  venmoHandle?: string;
  lastTripId?: string;
  joinedTripIds?: string[];
  createdAt: Timestamp | null;
};

export type TripDoc = {
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
  inviteCode: string;
  createdBy: string;
  createdAt: Timestamp | null;
  isArchived: boolean;
};

export type TripMemberDoc = {
  role: "admin" | "member";
  joinedAt: Timestamp | null;
};

export type ItineraryItemDoc = {
  time?: string;
  title: string;
  locationName?: string;
  locationUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type ExpenseDoc = {
  title: string;
  amountCents: number;
  currency: "USD";
  payerUid: string;
  participantUids: string[];
  splitType: "equal" | "custom" | "percent";
  note?: string;
  createdBy: string;
  createdAt: Timestamp | null;
};

export type SplitDoc = {
  owedCents: number;
  paidCents: number;
  state: "unpaid" | "marked_paid" | "confirmed";
  updatedAt: Timestamp | null;
  markedPaidAt?: Timestamp | null;
  confirmedAt?: Timestamp | null;
};

export type CurrentUserState = {
  uid: string;
  displayName: string;
  email: string;
  venmoHandle?: string;
};

export type SelectedTripState = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
};

export type TripMember = {
  uid: string;
  role: "admin" | "member";
  joinedAt: Timestamp | null;
  displayName: string;
  email: string;
  venmoHandle?: string;
};
