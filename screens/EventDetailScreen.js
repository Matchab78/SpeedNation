import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, ImageBackground } from "react-native";

export default function EventDetailScreen({ route, navigation }) {
  const event = route?.params?.event || {
    title: "Titre de l'événement",
    date: "Date à définir",
    time: "Horaire à définir",
    location: "Lieu à définir",
    link: "https://speednation.events",
  };

  const handleOpenLink = () => {
    if (event.link) {
      Linking.openURL(event.link).catch(() => {});
    }
  };

  return (
    <ImageBackground
      source={require("../assets/rassopage.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Détail de l'événement</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.eventTitle}>{event.title}</Text>

          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{event.date}</Text>

          {event.time ? (
            <>
              <Text style={styles.label}>Heure</Text>
              <Text style={styles.value}>{event.time}</Text>
            </>
          ) : null}

          <Text style={styles.label}>Lieu</Text>
          <Text style={styles.value}>{event.location}</Text>

          {event.link ? (
            <>
              <Text style={styles.label}>Lien</Text>
              <TouchableOpacity onPress={handleOpenLink}>
                <Text style={styles.linkText}>{event.link}</Text>
              </TouchableOpacity>
            </>
          ) : null}

            <TouchableOpacity style={styles.registerButton}>
              <Text style={styles.registerText}>S'inscrire</Text>
            </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "white",
    backgroundColor: "#000000ff",
  },
  backText: {
    color: "white",
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  value: {
    fontSize: 15,
    color: "#555",
  },
  linkText: {
    fontSize: 15,
    color: "#0000ee",
    textDecorationLine: "underline",
    marginTop: 4,
  },
  registerButton: {
    marginTop: 24,
    backgroundColor: "#000000ff",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  registerText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
