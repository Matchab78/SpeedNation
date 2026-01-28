import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ChatListScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      {/* Exemple d'un chat */}
      <TouchableOpacity
        style={styles.chatBox}
        onPress={() => navigation.navigate("Chat")}
      >
        <Text style={styles.chatName}>Quentin Ott</Text>
        <Text style={styles.chatLastMsg}>Pas mal</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.chatBox}
        onPress={() => navigation.navigate("Chat")}
      >
        <Text style={styles.chatName}>Tom Boulec</Text>
        <Text style={styles.chatLastMsg}>Viens BK ?</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  chatBox: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    marginBottom: 15,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  chatLastMsg: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
});

