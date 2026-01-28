import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import UserProfileScreen from "../screens/UserProfileScreen"; // ✅ bon fichier

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Profil public des autres */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}
