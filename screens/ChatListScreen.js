import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { messagingService } from "../services/messagingService";
import { useAuth } from "../utils/authContext";

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    
    // S'abonner aux nouvelles conversations/messages
    const subscription = messagingService.subscribeToConversations(
      user.id, 
      () => loadConversations()
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user.id]);

  const loadConversations = async () => {
    try {
      const result = await messagingService.getUserConversations(user.id);
      if (result.error) {
        console.error('Erreur chargement conversations:', result.error);
        return;
      }
      setConversations(result);
    } catch (error) {
      console.error('Erreur loadConversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = (conversation) => {
    navigation.navigate('Chat', { 
      conversationId: conversation.id,
      otherUser: conversation.otherUser
    });
  };

  const formatLastMessage = (message) => {
    if (!message) return "Nouvelle conversation";
    if (message.content.length > 50) {
      return message.content.substring(0, 50) + "...";
    }
    return message.content;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.chatBox}
      onPress={() => openConversation(item)}
    >
      <View style={styles.chatHeader}>
        {item.otherUser?.avatar_url ? (
          <Image
            source={{ uri: item.otherUser.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons 
              name="person" 
              size={24} 
              color="#666" 
            />
          </View>
        )}
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>
            {item.isGroup ? item.groupName : item.otherUser?.full_name || 'Utilisateur inconnu'}
          </Text>
          <Text style={styles.chatLastMsg}>
            {formatLastMessage(item.lastMessage)}
          </Text>
        </View>
        {item.lastMessage && (
          <Text style={styles.chatTime}>
            {formatTime(item.lastMessage.created_at)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>Aucun message</Text>
          <Text style={styles.emptySubText}>
            Commence une conversation avec un autre utilisateur
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  listContainer: {
    paddingBottom: 20,
  },
  chatBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    marginBottom: 12,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
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
  chatTime: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
