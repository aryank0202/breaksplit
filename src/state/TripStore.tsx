import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CurrentUserState, SelectedTripState } from "../types/backend";

type TripContextValue = {
  currentUser: CurrentUserState | null;
  selectedTripId: string | null;
  selectedTrip: SelectedTripState | null;
  tripDataVersion: number;
  setCurrentUser: (user: CurrentUserState | null) => void;
  setSelectedTripId: (tripId: string | null) => void;
  setSelectedTrip: (trip: SelectedTripState | null) => void;
  bumpTripDataVersion: () => void;
  resetStore: () => void;
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUserState | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SelectedTripState | null>(null);
  const [tripDataVersion, setTripDataVersion] = useState(0);

  const bumpTripDataVersion = useCallback(() => {
    setTripDataVersion((prev) => prev + 1);
  }, []);

  const resetStore = useCallback(() => {
    setCurrentUser(null);
    setSelectedTripId(null);
    setSelectedTrip(null);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const key = `breaksplit:lastTrip:${currentUser.uid}`;
    void AsyncStorage.setItem(key, selectedTripId ?? "");
  }, [currentUser?.uid, selectedTripId]);

  const value = useMemo(
    () => ({
      currentUser,
      selectedTripId,
      selectedTrip,
      tripDataVersion,
      setCurrentUser,
      setSelectedTripId,
      setSelectedTrip,
      bumpTripDataVersion,
      resetStore,
    }),
    [bumpTripDataVersion, currentUser, selectedTripId, selectedTrip, tripDataVersion]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrip must be used inside TripProvider");
  return context;
}
