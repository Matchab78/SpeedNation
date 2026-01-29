import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import UserProfileScreen from "../screens/UserProfileScreen";
import EventFormScreen from "../screens/EventFormScreen"; // ✅ AJOUT
import ChatScreen from "../screens/ChatScreen"; // ✅ AJOUT MESSAGERIE
import LoginScreen from "../screens/LoginScreen"; // ✅ AJOUT LOGIN
import CarDetailScreen from "../screens/CarDetailScreen";
import AdminPanelScreen from "../screens/AdminPanelScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false }}
    >
      {/* Tabs */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Login */}
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Profil public */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />

      {/* Formulaire Event (create/edit) */}
      <Stack.Screen name="EventForm" component={EventFormScreen} />

      <Stack.Screen name="CarDetail" component={CarDetailScreen} />

      {/* Conversation de messagerie */}
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Panel administrateur */}
      <Stack.Screen
        name="AdminPanel"
        component={AdminPanelScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
