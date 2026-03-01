import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { getTrip, listMyTrips } from "../api/trips";
import { useTrip } from "../state/TripStore";
import { theme } from "../theme";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [tripBootstrapDone, setTripBootstrapDone] = useState(false);
  const { selectedTripId, setCurrentUser, setSelectedTripId, setSelectedTrip, resetStore } = useTrip();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setIsAuthed(false);
        setTripBootstrapDone(true);
        setAuthReady(true);
        resetStore();
        return;
      }

      setIsAuthed(true);
      setTripBootstrapDone(false);
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

          if (freshUser?.lastTripId) {
            const lastTrip = await getTrip(freshUser.lastTripId);
            if (lastTrip) {
              setSelectedTripId(lastTrip.id);
              setSelectedTrip({
                id: lastTrip.id,
                name: lastTrip.name,
                startDate: lastTrip.startDate,
                endDate: lastTrip.endDate,
                timezone: lastTrip.timezone,
              });
              return;
            }
          }

          let myTrips: Awaited<ReturnType<typeof listMyTrips>> = [];
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              myTrips = await listMyTrips(firebaseUser.uid);
              if (myTrips.length > 0) break;
            } catch {
              // Retry a couple times for transient auth/firestore timing issues.
            }
            await new Promise((resolve) => setTimeout(resolve, 350));
          }

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
            const cachedTripId = await AsyncStorage.getItem(`breaksplit:lastTrip:${firebaseUser.uid}`);
            if (cachedTripId) {
              const cachedTrip = await getTrip(cachedTripId);
              if (cachedTrip) {
                setSelectedTripId(cachedTrip.id);
                setSelectedTrip({
                  id: cachedTrip.id,
                  name: cachedTrip.name,
                  startDate: cachedTrip.startDate,
                  endDate: cachedTrip.endDate,
                  timezone: cachedTrip.timezone,
                });
              } else {
                setSelectedTripId(null);
                setSelectedTrip(null);
              }
            } else {
              setSelectedTripId(null);
              setSelectedTrip(null);
            }
          }
        } catch (error) {
          // Keep app usable even if Firestore bootstrap fails.
          setSelectedTripId(null);
          setSelectedTrip(null);
        } finally {
          setTripBootstrapDone(true);
        }
      })();
    });

    return unsub;
  }, [resetStore, setCurrentUser, setSelectedTrip, setSelectedTripId]);

  if (!authReady || (isAuthed && !tripBootstrapDone)) {
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
