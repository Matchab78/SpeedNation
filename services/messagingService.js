import { supabase } from '../config/supabase';

export const messagingService = {
  // Obtenir toutes les conversations d'un utilisateur
  async getUserConversations(userId) {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, updated_at, is_group, group_name, group_image_url, participant1_id, participant2_id')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const convs = conversations || [];
      if (convs.length === 0) return [];

      const conversationIds = convs.map((c) => c.id);

      // Récupérer les profils des participants (on ne joint pas auth.users)
      const participantIds = Array.from(
        new Set(
          convs
            .flatMap((c) => [c.participant1_id, c.participant2_id])
            .filter(Boolean)
        )
      );

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', participantIds);

      if (profilesError) throw profilesError;

      const profilesById = new Map((profiles || []).map((p) => [p.id, p]));

      // Récupérer les derniers messages (une seule requête, puis on regroupe par conversation)
      const { data: recentMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id, conversation_id, content, created_at, sender_id')
        .in('conversation_id', conversationIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const lastMessageByConversationId = new Map();
      for (const msg of recentMessages || []) {
        if (!lastMessageByConversationId.has(msg.conversation_id)) {
          lastMessageByConversationId.set(msg.conversation_id, msg);
        }
      }

      return convs.map((conversation) => {
        const otherUserId = conversation.participant1_id === userId
          ? conversation.participant2_id
          : conversation.participant1_id;

        const otherUser = otherUserId ? profilesById.get(otherUserId) : null;

        return {
          id: conversation.id,
          otherUser,
          lastMessage: lastMessageByConversationId.get(conversation.id) || null,
          updatedAt: conversation.updated_at,
          isGroup: conversation.is_group,
          groupName: conversation.group_name,
          groupImageUrl: conversation.group_image_url,
        };
      });
    } catch (error) {
      console.error('Erreur getUserConversations:', error);
      return { error };
    }
  },

  // Créer ou récupérer une conversation privée entre deux utilisateurs
  async getOrCreatePrivateConversation(user1Id, user2Id) {
    try {
      // Vérifier si la conversation existe déjà
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`(participant1_id.eq.${user1Id},participant2_id.eq.${user2Id}),(participant1_id.eq.${user2Id},participant2_id.eq.${user1Id})`)
        .eq('is_group', false)
        .single();

      if (existing && !fetchError) {
        return { conversation: existing, isNew: false };
      }

      // Créer une nouvelle conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant1_id: user1Id,
          participant2_id: user2Id,
          is_group: false
        })
        .select()
        .single();

      if (error) throw error;
      
      return { conversation: data, isNew: true };
    } catch (error) {
      console.error('Erreur getOrCreatePrivateConversation:', error);
      return { error };
    }
  },

  // Obtenir les messages d'une conversation
  async getConversationMessages(conversationId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return { messages: data.reverse() }; // Reverse pour avoir les messages dans l'ordre chronologique
    } catch (error) {
      console.error('Erreur getConversationMessages:', error);
      return { error };
    }
  },

  // Envoyer un message
  async sendMessage(conversationId, senderId, content, messageType = 'text') {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType
        })
        .select(`
          *,
          sender:sender_id(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;
      
      return { message: data };
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      return { error };
    }
  },

  // Marquer les messages comme lus
  async markMessagesAsRead(conversationId, userId) {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erreur markMessagesAsRead:', error);
      return { error };
    }
  },

  // Obtenir le nombre de messages non lus
  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_message_count', { user_id: userId });

      if (error) throw error;
      
      return { count: data || 0 };
    } catch (error) {
      console.error('Erreur getUnreadCount:', error);
      return { count: 0 };
    }
  },

  // Supprimer un message
  async deleteMessage(messageId, userId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('sender_id', userId); // Seul l'expéditeur peut supprimer

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erreur deleteMessage:', error);
      return { error };
    }
  },

  // S'abonner aux messages d'une conversation en temps réel
  subscribeToMessages(conversationId, callback) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },

  // S'abonner aux conversations d'un utilisateur en temps réel
  subscribeToConversations(userId, callback) {
    const subscription = supabase
      .channel(`conversations:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `participant1_id=eq.${userId}`
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `participant2_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();

    return subscription;
  }
};
