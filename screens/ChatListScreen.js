import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  PanResponder
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { messagingService } from "../services/messagingService";
import { useAuth } from "../utils/authContext";
import { getImageUrl } from "../services/apiService";

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const openRowRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const intervalId = setInterval(() => {
      loadConversations();
    }, 4000); // Polling toutes les 4s pour la liste

    return () => clearInterval(intervalId);
  }, [userId]);

  // Protection : afficher un message si non connecté
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={60} color="#666" />
          <Text style={styles.errorTitle}>Connexion requise</Text>
          <Text style={styles.errorSubText}>
            Connecte-toi pour accéder à tes messages
          </Text>
        </View>
      </View>
    );
  }

  const loadConversations = async () => {
    try {
      const result = await messagingService.getUserConversations(userId);
      if (result.error) {
        console.error('Erreur chargement conversations:', result.error);
        return;
      }
      setConversations(result.data || []);
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

  const confirmHideConversation = (conversationId) => {
    Alert.alert(
      "Supprimer la conversation",
      "Supprimer cette conversation uniquement pour toi ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const res = await messagingService.hideConversation(conversationId, userId);
            if (res?.error) {
              console.error('Erreur hideConversation:', res.error);
              return;
            }
            setConversations((prev) => (prev || []).filter((c) => c.id !== conversationId));
          },
        },
      ]
    );
  };

  const SwipeRow = ({ item }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const close = () => {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    };

    const open = () => {
      Animated.spring(translateX, { toValue: -88, useNativeDriver: true }).start();
    };

    const panResponder = useMemo(() => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6 && Math.abs(gesture.dy) < 10,
      onPanResponderGrant: () => {
        if (openRowRef.current && openRowRef.current !== close) {
          openRowRef.current();
        }
        openRowRef.current = close;
      },
      onPanResponderMove: (_, gesture) => {
        const dx = Math.min(0, Math.max(-88, gesture.dx));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -44) {
          open();
        } else {
          close();
        }
      },
      onPanResponderTerminate: close,
    }), [translateX]);

    return (
      <View style={styles.swipeWrap}>
        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmHideConversation(item.id)}
            activeOpacity={0.85}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.deleteText}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[styles.swipeCard, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.chatBox}
            onPress={() => openConversation(item)}
            activeOpacity={0.85}
          >
            <View style={styles.chatHeader}>
              {item.otherUser?.avatar_url ? (
                <Image source={{ uri: getImageUrl(item.otherUser.avatar_url) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
              )}
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>
                  {item.is_group ? item.group_name : item.otherUser?.full_name || 'Utilisateur inconnu'}
                </Text>
                <Text style={[styles.chatLastMsg, item.unread_count > 0 && styles.unreadText]}>
                  {formatLastMessage(item.lastMessage)}
                </Text>
              </View>
              <View style={styles.chatMeta}>
                {item.lastMessage && (
                  <Text style={styles.chatTime}>
                    {formatTime(item.lastMessage.created_at)}
                  </Text>
                )}
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCountText}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
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

  const renderConversation = ({ item }) => <SwipeRow item={item} />;

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
  swipeWrap: {
    marginBottom: 12,
  },
  swipeActions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 88,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 76,
    height: 62,
    borderRadius: 12,
    backgroundColor: "#d11a2a",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  swipeCard: {
    borderRadius: 12,
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
  chatLastMsg: { color: "#888", fontSize: 13, marginTop: 4 },
  unreadText: { color: "#fff", fontWeight: "600" },
  chatMeta: { alignItems: "flex-end", justifyContent: "space-between", height: 40 },
  chatTime: { color: "#555", fontSize: 11 },
  unreadBadge: { backgroundColor: "#8916CB", minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 5, marginTop: 5 },
  unreadCountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  errorSubText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
