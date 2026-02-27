import React, { createContext, useContext, useMemo, useReducer } from "react";

// ---------- Types ----------
export type Member = {
  id: string;
  name: string;
  initials: string;
  color: string;
  isAdmin?: boolean;
};

export type Expense = {
  id: string;
  title: string;
  totalCents: number;
  paidById: string;
  createdAt: number; // Date.now()
  notes?: string;
};

export type Split = {
  expenseId: string;
  memberId: string;
  owedCents: number;
  paid: boolean;
};

export type ItineraryItem = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  time?: string;
  createdAt: number;
}

type State = {
  trip: {
    id: string;
    name: string;
    start: string;
    end: string;
  };
  members: Member[];
  expenses: Expense[];
  splits: Split[];
  itinerary: ItineraryItem[];
};

type Action =
  | {
      type: "ADD_EXPENSE";
      payload: {
        expense: Expense;
        splits: Split[];
      };
    }
    | { type: "DELETE_EXPENSE"; payload: { expenseId: string }}
  | {
      type: "TOGGLE_SPLIT_PAID";
      payload: { expenseId: string; memberId: string; paid: boolean };
    }
    | { type: "ADD_ITINERARY_ITEM"; payload: ItineraryItem }
    | { type: "DELETE_ITINERARY_ITEM"; payload: { id: string }
  };

const initialState: State = {
  trip: { id: "trip1", name: "Miami Spring Break", start: "March 8", end: "15, 2026" },
  members: [
    { id: "mike", name: "Mike Johnson", initials: "MJ", color: "#22C55E", isAdmin: true },
    { id: "me", name: "You", initials: "ME", color: "#3B82F6", isAdmin: true },
    { id: "sarah", name: "Sarah Martinez", initials: "SM", color: "#A855F7" },
    { id: "emma", name: "Emma Kim", initials: "EK", color: "#EC4899" },
    { id: "jake", name: "Jake Lopez", initials: "JL", color: "#F97316" },
    { id: "lisa", name: "Lisa Wang", initials: "LW", color: "#14B8A6" },
  ],
  expenses: [],
  splits: [],
  itinerary: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_EXPENSE":
      return {
        ...state,
        expenses: [action.payload.expense, ...state.expenses],
        splits: [...state.splits, ...action.payload.splits],
      };

    case "TOGGLE_SPLIT_PAID":
      return {
        ...state,
        splits: state.splits.map((s) =>
          s.expenseId === action.payload.expenseId && s.memberId === action.payload.memberId
            ? { ...s, paid: action.payload.paid }
            : s
        ),
      };

      case "DELETE_EXPENSE": {
        const { expenseId } = action.payload;
        return {
          ...state,
          expenses: state.expenses.filter((e) => e.id !== expenseId),
          splits: state.splits.filter((s) => s.expenseId !== expenseId),
        };
      }

      case "ADD_ITINERARY_ITEM": {
        return {
          ...state,
          itinerary: [...state.itinerary, action.payload],
        };
      }

      case "DELETE_ITINERARY_ITEM": {
        return {
          ...state,
          itinerary: state.itinerary.filter(i => i.id !== action.payload.id),
        };
      }

    default:
      return state;
  }
}

// ---------- Context ----------
const TripContext = createContext<
  | {
      state: State;
      addExpense: (args: {
        title: string;
        totalCents: number;
        paidById: string;
        participantIds: string[];
        notes?: string;
        splitMode: "equal" | "custom" | "percentage";
        customAmountsCents?: Record<string, number>;
        percentages?: Record<string, number>;
      }) => string; // returns expenseId
      togglePaid: (expenseId: string, memberId: string, paid: boolean) => void;
      deleteExpense: (expenseId: string) => void;
      addItinerary: (args: {
        title: string;
        description?: string;
        location?: string;
        date: string;
        time?: string;
      }) => string;
      deleteItinerary: (id: string) => void;
    }
  | undefined
>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function addItinerary(args : {
    title: string;
    description?: string;
    location?: string;
    date: string;
    time?: string;
  }) {
    const id = `iter_${Math.random().toString(36).slice(2, 10)}`;

    dispatch({
      type: "ADD_ITINERARY_ITEM",
      payload: {
        id,
        title: args.title,
        description: args.description,
        location: args.location,
        date: args.date,
        time: args.time,
        createdAt: Date.now()
      },
    });

    return id;
  }

  function deleteItinerary(id: string) {
    dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id }});
  }

  function deleteExpense(expenseId: string) {
    dispatch({ type: "DELETE_EXPENSE", payload: { expenseId } });
  }

  function addExpense(args: {
    title: string;
    totalCents: number;
    paidById: string;
    participantIds: string[];
    notes?: string;
    splitMode: "equal" | "custom" | "percentage";
    customAmountsCents?: Record<string, number>;
    percentages? : Record<string, number>;
  }) {
    const expenseId = `exp_${Math.random().toString(36).slice(2, 10)}`;
    const expense: Expense = {
      id: expenseId,
      title: args.title,
      totalCents: args.totalCents,
      paidById: args.paidById,
      createdAt: Date.now(),
      notes: args.notes,
    };

    let splits: Split[] = [];

if (args.splitMode === "equal") {
  const n = args.participantIds.length;
  const base = Math.floor(args.totalCents / n);
  const rem = args.totalCents % n;

  splits = args.participantIds.map((memberId, idx) => ({
    expenseId,
    memberId,
    owedCents: base + (idx < rem ? 1 : 0),
    paid: memberId === args.paidById,
  }));
}

if (args.splitMode === "custom") {
  const map = args.customAmountsCents ?? {};
  splits = args.participantIds.map((memberId) => ({
    expenseId,
    memberId,
    owedCents: map[memberId] ?? 0,
    paid: memberId === args.paidById,
  }));
}

if (args.splitMode === "percentage") {
  const pct = args.percentages ?? {};
  const ids = args.participantIds;

  // Convert % -> raw cents, then normalize rounding so total matches exactly.
  const raw = ids.map((id) => (args.totalCents * (pct[id] ?? 0)) / 100);

  const floored = raw.map((x) => Math.floor(x));
  let remainder = args.totalCents - floored.reduce((a, b) => a + b, 0);

  // Distribute leftover cents to the largest fractional parts first
  const fracOrder = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);

  const final = [...floored];
  for (let k = 0; k < fracOrder.length && remainder > 0; k++) {
    final[fracOrder[k].i] += 1;
    remainder -= 1;
  }

  splits = ids.map((memberId, idx) => ({
    expenseId,
    memberId,
    owedCents: final[idx],
    paid: memberId === args.paidById,
  }));
}

    

    dispatch({ type: "ADD_EXPENSE", payload: { expense, splits } });
    return expenseId;
  }

  function togglePaid(expenseId: string, memberId: string, paid: boolean) {
    dispatch({ type: "TOGGLE_SPLIT_PAID", payload: { expenseId, memberId, paid } });
  }

  const value = useMemo(
    () => ({
      state,
      addExpense,
      togglePaid,
      deleteExpense,
      addItinerary,
      deleteItinerary,
    }),
    [state]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside TripProvider");
  return ctx;
}

// ---------- Helpers ----------
export function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}