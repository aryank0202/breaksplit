import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TripHomeScreen from "../screens/TripHomeScreen";
import CreateTripScreen from "../screens/CreateTripScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ItineraryScreen from "../screens/ItineraryScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import ItineraryDayScreen from "../screens/ItineraryDayScreen";
import ExpenseDetailsScreen from "../screens/ExpenseDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TripHome"
          component={TripHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{ title: "Add Expense" }}
        />
        <Stack.Screen
          name="CreateTrip"
          component={CreateTripScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Itinerary"
          component={ItineraryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name = "ItineraryDay"
          component = {ItineraryDayScreen}
          options = {{headerShown: false}}
        />
        <Stack.Screen
          name = "ExpenseDetails"
          component = {ExpenseDetailsScreen}
          options = {{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
