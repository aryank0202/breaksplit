import React from "react";
import { View, Text } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

import ItineraryScreen from "./ItineraryScreen";
import ExpensesScreen from "./ExpensesScreen";
import MembersScreen from "./MembersScreen";

const Tab = createMaterialTopTabNavigator();

export default function TripHomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Header: pushed below Dynamic Island */}
      <View
        style={{
          paddingTop: insets.top + 8, // key line
          paddingHorizontal: 20,
          paddingBottom: 10,
          backgroundColor: theme.colors.bg,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: theme.colors.text,
          }}
        >
          Miami Spring Break
        </Text>

        <Text style={{ marginTop: 6, color: theme.colors.muted, fontWeight: "600" }}>
          March 8–15, 2026
        </Text>
      </View>

      {/* Tabs */}
      <Tab.Navigator
        initialRouteName="Itinerary"
        screenOptions={{
          tabBarStyle: { backgroundColor: "white" },
          tabBarIndicatorStyle: { backgroundColor: theme.colors.primary, height: 3 },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarLabelStyle: { fontWeight: "800", textTransform: "none" },
        }}
      >
        <Tab.Screen name="Itinerary" component={ItineraryScreen} />
        <Tab.Screen name="Expenses" component={ExpensesScreen} />
        <Tab.Screen name="Members" component={MembersScreen} />
      </Tab.Navigator>
    </View>
  );
}