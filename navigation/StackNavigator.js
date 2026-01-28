import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import UserProfileScreen from "../screens/UserProfileScreen";
import EventFormScreen from "../screens/EventFormScreen"; // ✅ AJOUT

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Profil public */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />

      {/* Formulaire Event (create/edit) */}
      <Stack.Screen name="EventForm" component={EventFormScreen} />
    </Stack.Navigator>
  );
}
