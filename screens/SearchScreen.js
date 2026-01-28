import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  return (
    <View style={styles.container}>
      
      {/* --- BARRE DE RECHERCHE --- */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={22} color="#8e8e8e" style={{ marginRight: 8 }} />
        
        <TextInput
          style={styles.input}
          placeholder="Rechercher une personne..."
          placeholderTextColor="#8e8e8e"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Tu pourras afficher les résultats ici plus tard */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 70,
    paddingHorizontal: 20,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
});

