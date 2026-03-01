import React, { createContext, useContext, useMemo, useState } from "react";
import type { CurrentUserState, SelectedTripState } from "../types/backend";

type TripContextValue = {
  currentUser: CurrentUserState | null;
  selectedTripId: string | null;
  selectedTrip: SelectedTripState | null;
  setCurrentUser: (user: CurrentUserState | null) => void;
  setSelectedTripId: (tripId: string | null) => void;
  setSelectedTrip: (trip: SelectedTripState | null) => void;
  resetStore: () => void;
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUserState | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SelectedTripState | null>(null);

  function resetStore() {
    setCurrentUser(null);
    setSelectedTripId(null);
    setSelectedTrip(null);
  }

  const value = useMemo(
    () => ({
      currentUser,
      selectedTripId,
      selectedTrip,
      setCurrentUser,
      setSelectedTripId,
      setSelectedTrip,
      resetStore,
    }),
    [currentUser, selectedTripId, selectedTrip]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrip must be used inside TripProvider");
  return context;
}
