import React from "react";
import { View, useWindowDimensions } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import EventsScreen from "../screens/EventsScreen";
import CarsScreen from "../screens/CarsScreen";
import SearchScreen from "../screens/SearchScreen";
import ChatListScreen from "../screens/ChatListScreen";
import { useAuth } from "../utils/authContext";
import DesktopLayout from "./DesktopLayout";

const Tab = createBottomTabNavigator();

// ── MOBILE TAB NAVIGATOR (unchanged) ──────────────────────────────────────────
function MobileTabNavigator({ navigation }) {
  const { unreadCount } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#16121F",
          height: 80,
          left: 20,
          right: 20,
          bottom: 25,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: "rgba(80, 70, 110, 0.4)",
          borderTopWidth: 1,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 5,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIcon: ({ focused }) => {
          let IconComponent = Ionicons;
          let iconName = "";

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Search":
              iconName = focused ? "search" : "search-outline";
              break;
            case "Messages":
              iconName = focused ? "chatbubble" : "chatbubble-outline";
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
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <IconComponent
                name={iconName}
                size={22}
                color={focused ? "#8916CB" : "#9B95AE"}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Messages"
        component={ChatListScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
          tabBarBadgeStyle: { backgroundColor: "#8916CB", color: "#fff", fontSize: 10 },
        }}
      />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Cars" component={CarsScreen} />
    </Tab.Navigator>
  );
}

// ── RESPONSIVE ROUTER ─────────────────────────────────────────────────────────
export default function TabNavigator({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (isDesktop) {
    return <DesktopLayout navigation={navigation} />;
  }

  return <MobileTabNavigator navigation={navigation} />;
}
