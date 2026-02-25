import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TripHomeScreen from "../screens/TripHomeScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}