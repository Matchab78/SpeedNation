import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { messagingService } from "../services/messagingService";
import { useAuth } from "../utils/authContext";

export default function ChatScreen({ route, navigation }) {
  const { user } = useAuth();
  const { conversationId, otherUser } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    loadMessages();
    
    // S'abonner aux nouveaux messages
    const subscription = messagingService.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        // Auto-scroll vers le bas
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    // Marquer les messages comme lus
    messagingService.markMessagesAsRead(conversationId, user.id);

    return () => {
      subscription?.unsubscribe();
    };
  }, [conversationId, user]);

  useEffect(() => {
    // Masquer le header de navigation pour utiliser notre header personnalisé
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadMessages = async () => {
    try {
      const result = await messagingService.getConversationMessages(conversationId);
      if (result.error) {
        console.error('Erreur chargement messages:', result.error);
        return;
      }
      setMessages(result.messages || []);
      
      // Scroll vers le bas après chargement
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Erreur loadMessages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const result = await messagingService.sendMessage(
        conversationId,
        user.id,
        newMessage.trim()
      );
      
      if (result.error) {
        console.error('Erreur envoi message:', result.error);
        return;
      }
      
      setNewMessage("");
    } catch (error) {
      console.error('Erreur sendMessage:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender_id === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          otherUser?.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              style={styles.messageAvatar}
            />
          ) : (
            <View style={[styles.messageAvatar, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons 
                name="person" 
                size={16} 
                color="#666" 
              />
            </View>
          )
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        
        {isOwnMessage && (
          user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.messageAvatar}
            />
          ) : (
            <View style={[styles.messageAvatar, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons 
                name="person" 
                size={16} 
                color="#666" 
              />
            </View>
          )
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Chargement de la conversation...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec avatar et nom */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <TouchableOpacity
            onPress={() =>
              otherUser?.id && navigation.navigate("UserProfile", { userId: otherUser.id })
            }
            style={styles.headerProfileTouchable}
          >
            {otherUser?.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: "#2a2a2a", justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="person" size={18} color="#666" />
              </View>
            )}
            <Text style={styles.headerName}>
              {otherUser?.full_name || "Utilisateur"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Écris un message..."
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backBtn: {
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerProfileTouchable: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    width: 40, // Équilibre avec le bouton retour à gauche
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  headerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  ownMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: "70%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: "#a855f7",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: "#888",
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#a855f7",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#333",
  },
});
