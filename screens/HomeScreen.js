import React from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={require("../assets/720sHomeScreen.jpg")}   // <-- TON IMAGE
      style={styles.background}
      resizeMode="cover"
    >

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.title}>SpeedNation</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* --- CONTENU --- */}
      <View style={styles.center}>
        <Text style={styles.welcome}>Bienvenue sur SpeedNation</Text>
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },

  loginButton: {
    backgroundColor: "#000000ff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  loginText: {
    color: "white",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  welcome: {
    fontSize: 20,
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  }
});
