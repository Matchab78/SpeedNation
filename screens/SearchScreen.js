import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { messagingService } from "../services/messagingService";
import { useAuth } from "../utils/authContext";

export default function SearchScreen({ navigation }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const t = setTimeout(() => {
      searchProfiles();
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const searchProfiles = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .ilike("full_name", `%${query}%`)
      .limit(20);

    if (!error) {
      setResults(data || []);
    } else {
      setResults([]);
      console.log("Supabase error:", error);
    }

    setLoading(false);
  };

  const handleMessageUser = async (profile) => {
    if (!user?.id) {
      return;
    }

    if (!profile?.id || profile.id === user.id) {
      return;
    }

    const res = await messagingService.getOrCreatePrivateConversation(user.id, profile.id);
    if (res?.error) {
      console.error("Erreur getOrCreatePrivateConversation:", res.error);
      return;
    }

    navigation.navigate("Chat", {
      conversationId: res.conversation.id,
      otherUser: {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={22} color="#8e8e8e" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher une personne..."
          placeholderTextColor="#8e8e8e"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rowLeft}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("UserProfile", { userId: item.id })}
            >
              <Image
                style={styles.avatar}
                source={{
                  uri:
                    item.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || "User")}`,
                }}
              />
              <Text style={styles.name}>{item.full_name || "Utilisateur"}</Text>
            </TouchableOpacity>

            {!!user?.id && user.id !== item.id && (
              <TouchableOpacity
                style={styles.messageBtn}
                activeOpacity={0.85}
                onPress={() => handleMessageUser(item)}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading && query.trim().length >= 2 ? (
            <Text style={styles.empty}>Aucun résultat</Text>
          ) : null
        }
      />
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  name: {
    color: "#fff",
    fontSize: 16,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#8916CB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  messageBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 24,
  },
});
