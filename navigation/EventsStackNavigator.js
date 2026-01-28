import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import EventsScreen from "../screens/EventsScreen";
import EventFormScreen from "../screens/EventFormScreen";

const Stack = createNativeStackNavigator();

export default function EventsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsHome" component={EventsScreen} />
      <Stack.Screen name="EventForm" component={EventFormScreen} />
    </Stack.Navigator>
  );
}

