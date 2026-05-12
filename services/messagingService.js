import { messagingApi } from './apiService';

export const messagingService = {
  // Obtenir toutes les conversations d'un utilisateur
  async getUserConversations(userId) {
    try {
      const { data } = await messagingApi.getConversations(userId);
      const formattedData = data.map(conv => {
        const isParticipant1 = conv.participant1_id === userId;
        return {
          ...conv,
          otherUser: {
            id: isParticipant1 ? conv.participant2_id : conv.participant1_id,
            full_name: isParticipant1 ? conv.participant2_name : conv.participant1_name,
            avatar_url: isParticipant1 ? conv.participant2_avatar : conv.participant1_avatar
          },
          lastMessage: conv.last_message || null
        };
      });
      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Erreur getUserConversations:', error);
      return { data: null, error };
    }
  },

  async hideConversation(conversationId, userId) {
    // Non implémenté pour l'instant
    return { success: false };
  },

  // Créer ou récupérer une conversation privée entre deux utilisateurs
  async getOrCreatePrivateConversation(user1Id, user2Id) {
    try {
      const { data } = await messagingApi.createConversation({
        participant1_id: user1Id,
        participant2_id: user2Id,
        is_group: false
      });
      return { conversation: data, isNew: true };
    } catch (error) {
      console.error('Erreur getOrCreatePrivateConversation:', error);
      return { error };
    }
  },

  // Obtenir les messages d'une conversation
  async getConversationMessages(conversationId, limit = 50) {
    try {
      const { data } = await messagingApi.getMessages(conversationId);
      return { messages: data };
    } catch (error) {
      console.error('Erreur getConversationMessages:', error);
      return { error };
    }
  },

  // Envoyer un message
  async sendMessage(conversationId, senderId, content, messageType = 'text') {
    try {
      const { data } = await messagingApi.sendMessage({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType
      });
      return { message: data };
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      return { error };
    }
  },

  // Marquer les messages comme lus
  async markMessagesAsRead(conversationId, userId) {
    // Non implémenté pour l'instant
    return { success: false };
  },

  // Obtenir le nombre de messages non lus
  async getUnreadCount(userId) {
    // Non implémenté pour l'instant
    return { count: 0 };
  },

  // Supprimer un message
  async deleteMessage(messageId, userId) {
    // Non implémenté pour l'instant
    return { success: false };
  },

  // S'abonner aux messages d'une conversation en temps réel (non implémenté)
  subscribeToMessages(conversationId, callback) {
    // Non implémenté - le backend ne supporte pas WebSocket pour l'instant
    return null;
  },

  // S'abonner aux conversations d'un utilisateur en temps réel (non implémenté)
  subscribeToConversations(userId, callback) {
    // Non implémenté - le backend ne supporte pas WebSocket pour l'instant
    return null;
  }
};
