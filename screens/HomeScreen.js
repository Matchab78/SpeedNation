import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ImageBackground } from "react-native";
import { useAuth } from "../utils/authContext";

export default function HomeScreen({ navigation }) {
  const [showEvents, setShowEvents] = useState(false);
  const [showCars, setShowCars] = useState(false);
  const { user, profile } = useAuth();

  return (
    <ImageBackground
      source={require("../assets/homescreen.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>

        {/* --- HEADER --- */}
        <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {user ? (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              // Naviguer vers l'onglet Cars qui affiche le profil
              navigation.getParent()?.navigate("Cars");
            }}
          >
            <Text style={styles.profileText}>
              {profile?.full_name ? profile.full_name.split(' ')[0] : 'Profil'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- CONTENU --- */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Bienvenue sur SpeedNation</Text>

        {/* Widget Prochains Rassemblements */}
        <View style={styles.widget}>
          <TouchableOpacity style={styles.widgetHeader} onPress={() => setShowEvents(!showEvents)}>
            <Text style={styles.widgetTitle}>Nos prochains rassemblements</Text>
            <Text style={styles.expandIcon}>{showEvents ? "▼" : "▶"}</Text>
          </TouchableOpacity>
          {showEvents && (
            <View style={styles.widgetContent}>
              <View style={styles.eventItem}>
                <Text style={styles.eventTitle}>Rassemblement Supercars</Text>
                <Text style={styles.eventInfo}>12 Avril 2025 • Paris</Text>
              </View>
              <View style={styles.eventItem}>
                <Text style={styles.eventTitle}>Trackday Circuit Paul Ricard</Text>
                <Text style={styles.eventInfo}>22 Mai 2025 • Le Castellet</Text>
              </View>
              <TouchableOpacity style={styles.widgetButton}>
                <Text style={styles.widgetButtonText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Widget Dernières Voitures */}
        <View style={styles.widget}>
          <TouchableOpacity style={styles.widgetHeader} onPress={() => setShowCars(!showCars)}>
            <Text style={styles.widgetTitle}>Nos derniers ajouts</Text>
            <Text style={styles.expandIcon}>{showCars ? "▼" : "▶"}</Text>
          </TouchableOpacity>
          {showCars && (
            <View style={styles.widgetContent}>
              <View style={styles.carItem}>
                <Text style={styles.carTitle}>Ferrari 488 GTB</Text>
                <Text style={styles.carInfo}>Ajoutée il y a 2 jours</Text>
              </View>
              <View style={styles.carItem}>
                <Text style={styles.carTitle}>Lamborghini Huracán</Text>
                <Text style={styles.carInfo}>Ajoutée il y a 5 jours</Text>
              </View>
              <TouchableOpacity style={styles.widgetButton}>
                <Text style={styles.widgetButtonText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 0,
    paddingRight: 20,
    paddingTop: 30,
  },

  logo: {
    width: 140,
    height: 80,
  },

  loginButton: {
    backgroundColor: "#111111",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
  },

  loginText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  profileButton: {
    backgroundColor: "#8916CB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#8916CB",
  },

  profileText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 20,
  },

  welcome: {
    fontSize: 22,
    color: "#ffffff",
    marginBottom: 60,
    textAlign: "left",
    fontWeight: "600",
  },

  widgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  expandIcon: {
    fontSize: 16,
    color: "#8916CB",
  },

  /* --- WIDGETS --- */
  widget: {
    backgroundColor: "#101010",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#262626",
  },

  widgetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#ffffff",
  },

  widgetContent: {
    marginBottom: 12,
  },

  eventItem: {
    marginBottom: 10,
  },

  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f5f5f5",
  },

  eventInfo: {
    fontSize: 13,
    color: "#9e9e9e",
    marginTop: 2,
  },

  carItem: {
    marginBottom: 10,
  },

  carTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f5f5f5",
  },

  carInfo: {
    fontSize: 13,
    color: "#9e9e9e",
    marginTop: 2,
  },

  widgetButton: {
    backgroundColor: "#8916CB",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 4,
  },

  widgetButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

// TEST
