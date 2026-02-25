import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/DashboardScreen";
import ExpensesScreen from "../screens/ExpensesSceen";
import ItineraryScreen from "../screens/ItineraryScreen";
import MembersScreen from "../screens/MembersScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TripTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Itinerary" component={ItineraryScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Members" component={MembersScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Miami Spring Break" }}
        />
        <Stack.Screen
          name="Trip"
          component={TripTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{ title: "Add Expense" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}