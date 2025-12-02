import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

import StackNavigator from "./StackNavigator";
import EventsScreen from "../screens/EventsScreen";
import CarsScreen from "../screens/CarsScreen";
import SearchScreen from "../screens/SearchScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,

        // ---- STYLE DE LA NAVBAR ----
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#000000ff",
          height: 80,                 // un peu plus haut pour bien centrer
          left: 20,
          right: 20,
          bottom: 20,
          borderRadius: 25,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
          borderTopWidth: 0,
          paddingTop: 15,             // centre verticalement
          paddingBottom: 15,          // remonte proprement les icônes
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarShowLabel: false,

        tabBarIcon: ({ focused }) => {
          let IconComponent = Ionicons;
          let iconName = "";

          switch (route.name) {
            case "Home":
              iconName = "home-outline";
              break;

            case "Search":
              iconName = "search";
              break;

            case "Events":
              IconComponent = FontAwesome5;
              iconName = "map-marked-alt";
              break;

            case "Cars":
              IconComponent = FontAwesome5;
              iconName = "car";
              break;
          }

          return (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconComponent
                name={iconName}
                size={26}
                color={focused ? "#fff" : "#8e8e8e"}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={StackNavigator} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Cars" component={CarsScreen} />
    </Tab.Navigator>
  );
}
