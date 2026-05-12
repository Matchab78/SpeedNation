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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { messagingService } from "../services/messagingService";
import { useAuth } from "../utils/authContext";
import { profilesApi, getImageUrl } from "../services/apiService";

export default function SearchScreen({ navigation }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentUsers();
  }, []);

  const loadRecentUsers = async () => {
    try {
      const res = await profilesApi.getRecent();
      if (res.data) setRecentUsers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const t = setTimeout(() => {
      searchProfiles();
    }, 400);

    return () => clearTimeout(t);
  }, [query]);


  const searchProfiles = async () => {
    setLoading(true);
    try {
      const response = await profilesApi.search(query);
      if (response.data) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUser = async (profile) => {
    if (!user?.id || !profile?.id || profile.id === user.id) return;

    try {
      const res = await messagingService.getOrCreatePrivateConversation(user.id, profile.id);
      if (res?.error) throw res.error;

      navigation.navigate("Chat", {
        conversationId: res.conversation.id,
        otherUser: {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ouvrir la conversation.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowLeft}
        onPress={() => navigation.navigate("UserProfile", { userId: item.id })}
      >
        <Image
          style={styles.avatar}
          source={{
            uri: item.avatar_url ? getImageUrl(item.avatar_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || "U")}&background=8916CB&color=fff`,
          }}
        />
        <View>
          <Text style={styles.name}>{item.full_name || "Utilisateur"}</Text>
          {item.profession ? <Text style={styles.profession}>{item.profession}</Text> : null}
        </View>
      </TouchableOpacity>

      {user?.id !== item.id && (
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => handleMessageUser(item)}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const displayData = query.trim().length >= 2 ? results : recentUsers;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher un membre..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} color="#8916CB" />}

      {query.trim().length < 2 && recentUsers.length > 0 && (
        <Text style={styles.sectionTitle}>Suggestions (récemment actifs)</Text>
      )}

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          !loading && query.trim().length >= 2 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>Aucun membre trouvé avec ce nom</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 70, paddingHorizontal: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  input: { flex: 1, color: "#fff", fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 15, backgroundColor: '#222' },
  name: { color: "#fff", fontSize: 16, fontWeight: '600' },
  profession: { color: "#888", fontSize: 12, marginTop: 2 },
  sectionTitle: { color: "#8916CB", fontSize: 12, fontWeight: '800', marginTop: 25, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#222",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  messageBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  emptyWrap: { marginTop: 40, alignItems: 'center' },
  empty: { color: "#555", fontSize: 14 },
});
