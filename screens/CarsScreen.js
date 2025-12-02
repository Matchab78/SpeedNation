import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";

export default function ProfileScreen() {
  
  // Onglet actif (Mes voitures / Mes favoris)
  const [activeTab, setActiveTab] = useState("cars");

  // Exemple de données voitures
  const cars = [
    {
      id: "1",
      name: "Porsche 911 GT3 • 2023",
      price: "355 000€",
      power: "329 Ch",
      image: require("../assets/911GT3List.jpg"),
      favorite: false,
    },
    {
      id: "2",
      name: "BMW M3 Compétition • 2023",
      price: "158 170€",
      power: "617 Ch",
      image: require("../assets/M3GreyList.jpg"),
      favorite: true,
    },
  ];

  const renderCarCard = ({ item }) => (
    <View style={styles.carCard}>

      {/* Photo */}
      <Image source={item.image} style={styles.carImage} resizeMode="contain" />

      {/* Infos */}
      <View style={styles.carInfoContainer}>
        <Text style={styles.carTitle}>{item.name}</Text>
        <Text style={styles.carDetails}>{item.price} • {item.power}</Text>
      </View>

      {/* Bouton Like
      <TouchableOpacity style={styles.likeButton}>
        <Text style={{ fontSize: 22 }}>
          {item.favorite ? "💙" : "🤍"}
        </Text>
      </TouchableOpacity> */}

    </View>
  );

  return (
    <View style={styles.container}>

      {/* --- HEADER PROFIL --- */}
      <View style={styles.profileCard}>
        <Image
          source={require("../assets/PP.webp")}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Mathis CHABAULT</Text>
          <Text style={styles.info}>étudiant</Text>
          <Text style={styles.info}>Paris, France — 21 ans</Text>
          <Text style={styles.followers}>2 FOLLOWERS</Text>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* --- TABS --- */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab("cars")}>
          <Text style={[
            styles.tabText,
            activeTab === "cars" && styles.activeTabText
          ]}>
            MES VOITURES
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity onPress={() => setActiveTab("fav")}>
          <Text style={[
            styles.tabText,
            activeTab === "fav" && styles.activeTabText
          ]}>
            MES FAVORIS
          </Text>
        </TouchableOpacity> */}
      </View>

      {/* --- LISTE DES VOITURES --- */}
      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={renderCarCard}
        contentContainerStyle={{ paddingBottom: 150 }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 55,
  },

  /* --- Profil card --- */
  profileCard: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },

  name: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  info: {
    color: "#ccc",
    fontSize: 14,
  },

  followers: {
    color: "#39B54A",
    fontWeight: "bold",
    marginTop: 4,
  },

  menuButton: {
    marginLeft: 10,
    padding: 10,
  },

  menuText: {
    fontSize: 28,
    color: "white",
  },

  /* --- Tabs --- */
  tabs: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 15,
  },

  tabText: {
    color: "#aaa",
    fontSize: 16,
  },

  activeTabText: {
    color: "white",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },

  /* --- Car cards --- */
  carCard: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  carImage: {
    width: 120,
    height: 80,
  },

  carInfoContainer: {
    flex: 1,
    marginLeft: 10,
  },

  carTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  carDetails: {
    color: "#ccc",
    marginTop: 3,
  },

  likeButton: {
    padding: 10,
  },
});
