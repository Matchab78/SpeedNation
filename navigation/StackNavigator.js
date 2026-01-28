import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import UserProfileScreen from "../screens/UserProfileScreen";
import EventFormScreen from "../screens/EventFormScreen"; // ✅ AJOUT
import ChatScreen from "../screens/ChatScreen"; // ✅ AJOUT MESSAGERIE

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

      {/* Conversation de messagerie */}
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
        }}
      />
    </Stack.Navigator>
  );
}
