import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./utils/authContext";
import TabNavigator from "./navigation/TabNavigator";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
