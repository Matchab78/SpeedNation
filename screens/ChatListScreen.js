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
  PanResponder,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

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

  const showSecurityInfo = () => {
    showAlert(
      "Sécurisation des données",
      "Vos messages sont protégés. Les données transitent via un tunnel sécurisé (SSL/HTTPS) et sont stockées de manière isolée dans notre base de données sur le VPS. \n\nL'accès est restreint et nous travaillons sur le cryptage de bout en bout pour une confidentialité totale."
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.headerRow}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity onPress={showSecurityInfo} style={styles.helpIcon}>
          <Ionicons name="help-circle-outline" size={24} color="#8916CB" />
        </TouchableOpacity>
      </View>

      
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#1a1a1a" />
          <Text style={styles.emptyText}>Commencez à discuter</Text>
          <Text style={styles.emptySubText}>
            Recherchez un profil et envoyez un message pour débuter une conversation.
          </Text>
          <TouchableOpacity 
            style={styles.startBtn}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.startBtnText}>Rechercher un membre</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.foreground,
    letterSpacing: -0.5,
  },
  helpIcon: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listContainer: {
    paddingBottom: 100,
  },
  chatBox: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    height: 70,
    borderRadius: 18,
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
    borderRadius: 20,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.foreground,
  },
  chatLastMsg: { color: COLORS.mutedForeground, fontSize: 13, marginTop: 4 },
  unreadText: { color: COLORS.foreground, fontWeight: "700" },
  chatMeta: { alignItems: "flex-end", justifyContent: "space-between", height: 44 },
  chatTime: { color: COLORS.mutedForeground, fontSize: 11 },
  unreadBadge: { backgroundColor: COLORS.primary, minWidth: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 6, marginTop: 5 },
  unreadCountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.mutedForeground,
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyText: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
  },
  emptySubText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    marginTop: 30,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  startBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  errorSubText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
