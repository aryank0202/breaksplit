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
};

type Action =
  | {
      type: "ADD_EXPENSE";
      payload: {
        expense: Expense;
        splits: Split[];
      };
    }
  | {
      type: "TOGGLE_SPLIT_PAID";
      payload: { expenseId: string; memberId: string; paid: boolean };
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
      }) => string; // returns expenseId
      togglePaid: (expenseId: string, memberId: string, paid: boolean) => void;
    }
  | undefined
>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function addExpense(args: {
    title: string;
    totalCents: number;
    paidById: string;
    participantIds: string[];
    notes?: string;
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

    // Equal split (for now)
    const n = args.participantIds.length;
    const base = Math.floor(args.totalCents / n);
    const rem = args.totalCents % n;

    const splits: Split[] = args.participantIds.map((memberId, idx) => ({
      expenseId,
      memberId,
      owedCents: base + (idx < rem ? 1 : 0),
      // if payer is included, their share is considered "paid"
      paid: memberId === args.paidById,
    }));

    dispatch({ type: "ADD_EXPENSE", payload: { expense, splits } });
    return expenseId;
  }

  function togglePaid(expenseId: string, memberId: string, paid: boolean) {
    dispatch({ type: "TOGGLE_SPLIT_PAID", payload: { expenseId, memberId, paid } });
  }

  const value = useMemo(() => ({ state, addExpense, togglePaid }), [state]);

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