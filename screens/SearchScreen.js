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

const COLORS = {
  background: "#0B0813",
  surface: "#16121F",
  surfaceElevated: "#1E1A2B",
  border: "rgba(80, 70, 110, 0.4)",
  foreground: "#FAFAFA",
  mutedForeground: "#9B95AE",
  primary: "#8916CB",
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    paddingTop: 70, 
    paddingHorizontal: 20 
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: { flex: 1, color: COLORS.foreground, fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 18, 
    marginRight: 15, 
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  name: { color: COLORS.foreground, fontSize: 16, fontWeight: '600' },
  profession: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2 },
  sectionTitle: { 
    color: COLORS.primary, 
    fontSize: 11, 
    fontWeight: '800', 
    marginTop: 25, 
    marginBottom: 12, 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageBtnText: { color: COLORS.foreground, fontWeight: "600", fontSize: 12 },
  emptyWrap: { marginTop: 40, alignItems: 'center' },
  empty: { color: COLORS.mutedForeground, fontSize: 14 },
});
