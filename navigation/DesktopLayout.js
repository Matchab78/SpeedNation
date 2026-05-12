import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../utils/authContext";
import { getImageUrl } from "../services/apiService";

import HomeScreen from "../screens/HomeScreen";
import EventsScreen from "../screens/EventsScreen";
import CarsScreen from "../screens/CarsScreen";
import SearchScreen from "../screens/SearchScreen";
import ChatListScreen from "../screens/ChatListScreen";

const COLORS = {
  background: "#0B0813",
  surface: "#16121F",
  surfaceElevated: "#1E1A2B",
  border: "rgba(80, 70, 110, 0.4)",
  foreground: "#FAFAFA",
  mutedForeground: "#9B95AE",
  primary: "#8916CB",
  primaryGlow: "#A855F7",
};

const NAV_ITEMS = [
  { name: "Home", label: "Accueil", icon: "home", iconFocused: "home", lib: "Ionicons" },
  { name: "Search", label: "Recherche", icon: "search-outline", iconFocused: "search", lib: "Ionicons" },
  { name: "Messages", label: "Messages", icon: "chatbubble-outline", iconFocused: "chatbubble", lib: "Ionicons" },
  { name: "Events", label: "Événements", icon: "map-marked-alt", iconFocused: "map-marked-alt", lib: "FontAwesome5" },
  { name: "Cars", label: "Profil & Garage", icon: "car", iconFocused: "car", lib: "FontAwesome5" },
];

// Fake navigation object to pass into screens
function createFakeNavigation(activeTab, setActiveTab, realNavigation) {
  return {
    navigate: (screenName, params) => {
      // Handle sub-screens that need the real navigator
      if (["LoginScreen", "UserProfile", "EventForm", "CarDetail", "Chat", "AdminPanel"].includes(screenName)) {
        realNavigation.navigate(screenName, params);
      } else {
        setActiveTab(screenName);
      }
    },
    goBack: () => realNavigation.goBack(),
    addListener: (event, cb) => {
      // Simulate focus trigger once
      if (event === "focus") setTimeout(cb, 0);
      return () => {};
    },
    isFocused: () => true,
  };
}

export default function DesktopLayout({ navigation }) {
  const { width } = useWindowDimensions();
  const { user, profile, unreadCount } = useAuth();
  const [activeTab, setActiveTab] = useState("Home");

  // If mobile width, don't render (handled by TabNavigator)
  if (width < 768) return null;

  const fakeNav = createFakeNavigation(activeTab, setActiveTab, navigation);
  const isCollapsed = width < 1100;

  const renderScreen = () => {
    switch (activeTab) {
      case "Home": return <HomeScreen navigation={fakeNav} />;
      case "Search": return <SearchScreen navigation={fakeNav} />;
      case "Messages": return <ChatListScreen navigation={fakeNav} />;
      case "Events": return <EventsScreen navigation={fakeNav} />;
      case "Cars": return <CarsScreen navigation={fakeNav} />;
      default: return <HomeScreen navigation={fakeNav} />;
    }
  };

  return (
    <View style={styles.root}>
      {/* ── LEFT SIDEBAR ── */}
      <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
        {/* Brand */}
        <View style={styles.sidebarBrand}>
          <Image
            source={require("../assets/logo.png")}
            style={isCollapsed ? styles.logoSmall : styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Nav items */}
        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const focused = activeTab === item.name;
            const IconComponent = item.lib === "FontAwesome5" ? FontAwesome5 : Ionicons;
            const iconName = focused ? item.iconFocused : item.icon;
            const hasBadge = item.name === "Messages" && unreadCount > 0;

            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, focused && styles.navItemActive]}
                onPress={() => setActiveTab(item.name)}
                activeOpacity={0.7}
              >
                <View style={styles.navIconWrap}>
                  <IconComponent
                    name={iconName}
                    size={20}
                    color={focused ? COLORS.primaryGlow : COLORS.mutedForeground}
                  />
                  {hasBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
                {!isCollapsed && (
                  <Text style={[styles.navLabel, focused && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                )}
                {focused && <View style={styles.navActiveIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom: user profile mini */}
        <View style={styles.sidebarFooter}>
          <View style={styles.divider} />
          {user ? (
            <TouchableOpacity
              style={styles.userMini}
              onPress={() => setActiveTab("Cars")}
              activeOpacity={0.8}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: getImageUrl(profile.avatar_url) }}
                  style={styles.userAvatar}
                />
              ) : (
                <View style={[styles.userAvatar, { backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                    {(profile?.full_name || user.email || "?")[0].toUpperCase()}
                  </Text>
                </View>
              )}
              {!isCollapsed && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {profile?.full_name || user.email}
                  </Text>
                  <Text style={styles.userRole} numberOfLines={1}>
                    {profile?.profession || "Membre"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate("LoginScreen")}
            >
              <Ionicons name="log-in-outline" size={20} color={COLORS.primaryGlow} />
              {!isCollapsed && (
                <Text style={styles.loginBtnText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── MAIN CONTENT ── */}
      <View style={styles.main}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topBarTitle}>
              {NAV_ITEMS.find((i) => i.name === activeTab)?.label || "SpeedNation"}
            </Text>
            <Text style={styles.topBarSub}>La communauté des passionnés</Text>
          </View>
          <View style={styles.topBarActions}>
            <View style={styles.topBarPill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN DIRECT</Text>
            </View>
          </View>
        </View>

        {/* Screen content */}
        <View style={styles.contentArea}>
          {renderScreen()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.background,
  },

  /* ── SIDEBAR ── */
  sidebar: {
    width: 260,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  sidebarCollapsed: {
    width: 72,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  sidebarBrand: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  logo: { width: 150, height: 50 },
  logoSmall: { width: 40, height: 40 },

  navList: { flex: 1, gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    position: "relative",
  },
  navItemActive: {
    backgroundColor: "rgba(137, 22, 203, 0.12)",
  },
  navIconWrap: { position: "relative" },
  navLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.mutedForeground,
    flex: 1,
  },
  navLabelActive: {
    color: COLORS.foreground,
    fontWeight: "600",
  },
  navActiveIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primaryGlow,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  sidebarFooter: {},
  userMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userName: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  userRole: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    marginTop: 1,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(137, 22, 203, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(137, 22, 203, 0.3)",
  },
  loginBtnText: {
    color: COLORS.primaryGlow,
    fontWeight: "600",
    fontSize: 14,
  },

  /* ── MAIN AREA ── */
  main: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: COLORS.background,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  topBarTitle: {
    color: COLORS.foreground,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  topBarSub: {
    color: COLORS.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topBarPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(137, 22, 203, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(137, 22, 203, 0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryGlow,
  },
  liveText: {
    color: COLORS.primaryGlow,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  contentArea: {
    flex: 1,
    overflow: "hidden",
  },
});
