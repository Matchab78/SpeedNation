import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './utils/authContext';
import StackNavigator from './navigation/StackNavigator';

import { StatusBar } from 'expo-status-bar';
import { DefaultTheme } from '@react-navigation/native';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B0813', // Couleur de fond premium
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={MyTheme}>
        <StatusBar style="light" />
        <StackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
