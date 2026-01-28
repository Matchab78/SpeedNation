import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

import StackNavigator from "./StackNavigator";
import EventsScreen from "../screens/EventsScreen";
import CarsScreen from "../screens/CarsScreen";
import SearchScreen from "../screens/SearchScreen";
import ChatListScreen from "../screens/ChatListScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          height: 80,
          left: 20,
          right: 20,
          bottom: 20,
          borderRadius: 25,
          shadowColor: "transparent",
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          borderTopWidth: 0,
          paddingTop: 15,
          paddingBottom: 15,
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
            case "Messages":
              iconName = "chatbubble-outline";
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
                color={focused ? "#8916CB" : "#8e8e8e"}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={StackNavigator} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Cars" component={CarsScreen} />
    </Tab.Navigator>
  );
}
