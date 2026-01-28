import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ImageBackground 
} from "react-native";

export default function EventsScreen({ navigation }) {

  const [events, setEvents] = useState([
    {
      id: "1",
      title: "Rassemblement Supercars",
      date: "12 Avril 2025",
      location: "Paris - La Défense",
    },
    {
      id: "2",
      title: "Trackday Circuit Paul Ricard",
      date: "22 Mai 2025",
      location: "Le Castellet",
    },
  ]);

  const renderEventCard = ({ item }) => (
    <View style={styles.card}>
      {/* Texte de la card */}
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardInfo}>{item.date}</Text>
        <Text style={styles.cardInfo}>{item.location}</Text>
      </View>

      {/* Bouton + */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => navigation.navigate("EventDetail", { event: item })}
      >
        <Text style={styles.moreText}>more</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require("../assets/eventscreen.jpeg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Événements</Text>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => console.log("Créer un événement")}
        >
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* LISTE */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      />

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
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
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffffff",
  },

  addButton: {
    backgroundColor: "#000000ff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: -2
  },

  /* --- CARDS --- */
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },

  cardInfo: {
    fontSize: 15,
    color: "#555",
  },

  /* --- BOUTON + SUR LES CARDS --- */
  moreButton: {
    backgroundColor: "#000000ff",
    width: 40,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,   // cercle parfait
    marginLeft: 15,
    marginTop: 50,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 4,
  },

  moreText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: -2,
  },

});

// TEST
