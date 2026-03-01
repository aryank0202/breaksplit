import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";

import TripHomeScreen from "../screens/TripHomeScreen";
import CreateTripScreen from "../screens/CreateTripScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ItineraryScreen from "../screens/ItineraryScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import ItineraryDayScreen from "../screens/ItineraryDayScreen";
import ExpenseDetailsScreen from "../screens/ExpenseDetailsScreen";
import { auth } from "../firebase";
import { getUser, upsertUserProfile } from "../api/users";
import { listMyTrips } from "../api/trips";
import { useTrip } from "../state/TripStore";
import { theme } from "../theme";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const { selectedTripId, setCurrentUser, setSelectedTripId, setSelectedTrip, resetStore } = useTrip();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setIsAuthed(false);
        setAuthReady(true);
        resetStore();
        return;
      }

      setIsAuthed(true);
      setAuthReady(true);
      setCurrentUser({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "User",
        email: firebaseUser.email ?? "",
        venmoHandle: undefined,
      });

      void (async () => {
        try {
          const userDoc = await getUser(firebaseUser.uid);
          if (!userDoc) {
            await upsertUserProfile(firebaseUser.uid, {
              displayName: firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "User",
              email: firebaseUser.email ?? "",
            });
          }

          const freshUser = await getUser(firebaseUser.uid);
          if (freshUser) {
            setCurrentUser({
              uid: firebaseUser.uid,
              displayName: freshUser.displayName,
              email: freshUser.email,
              venmoHandle: freshUser.venmoHandle,
            });
          }

          const myTrips = await listMyTrips(firebaseUser.uid);
          if (myTrips.length > 0) {
            const firstTrip = myTrips[0];
            setSelectedTripId(firstTrip.id);
            setSelectedTrip({
              id: firstTrip.id,
              name: firstTrip.name,
              startDate: firstTrip.startDate,
              endDate: firstTrip.endDate,
              timezone: firstTrip.timezone,
            });
          } else {
            setSelectedTripId(null);
            setSelectedTrip(null);
          }
        } catch (error) {
          // Keep app usable even if Firestore bootstrap fails.
          setSelectedTripId(null);
          setSelectedTrip(null);
        }
      })();
    });

    return unsub;
  }, [resetStore, setCurrentUser, setSelectedTrip, setSelectedTripId]);

  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthed ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : !selectedTripId ? (
          <>
            <Stack.Screen
              name="CreateTrip"
              component={CreateTripScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="TripHome" component={TripHomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="TripHome" component={TripHomeScreen} />
            <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Itinerary" component={ItineraryScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="ItineraryDay" component={ItineraryDayScreen} />
            <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
