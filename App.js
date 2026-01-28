import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './utils/authContext';
import StackNavigator from './navigation/StackNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
