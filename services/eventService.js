import { supabase } from '../config/supabase';

/**
 * Service pour gérer les événements
 */
export const eventService = {
  /**
   * Récupérer tous les événements
   */
  async getAllEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles(full_name, avatar_url)')
        .order('event_date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Récupérer un événement par son ID
   */
  async getEventById(eventId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles(full_name, avatar_url), event_participants(count)')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Créer un nouvel événement (seulement pour les administrateurs)
   */
  async createEvent(creatorId, eventData) {
    try {
      // Vérifier que l'utilisateur est administrateur
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', creatorId)
        .single();

      if (userError) throw userError;

      if (userData?.role !== 'admin') {
        return {
          data: null,
          error: {
            message: 'Seuls les administrateurs peuvent créer des événements',
            code: 'PERMISSION_DENIED',
          },
        };
      }

      // Créer l'événement
      const { data, error } = await supabase
        .from('events')
        .insert({
          creator_id: creatorId,
          title: eventData.title,
          description: eventData.description || null,
          event_date: eventData.event_date,
          event_time: eventData.event_time || null,
          location: eventData.location,
          image_url: eventData.image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Mettre à jour un événement
   */
  async updateEvent(eventId, creatorId, updates) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('creator_id', creatorId) // Sécurité
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Supprimer un événement
   */
  async deleteEvent(eventId, creatorId) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('creator_id', creatorId); // Sécurité

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Rejoindre un événement
   */
  async joinEvent(userId, eventId) {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          user_id: userId,
          event_id: eventId,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Quitter un événement
   */
  async leaveEvent(userId, eventId) {
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Vérifier si un utilisateur participe à un événement
   */
  async isParticipating(userId, eventId) {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { isParticipating: !!data, error: null };
    } catch (error) {
      return { isParticipating: false, error };
    }
  },

  /**
   * Récupérer les participants d'un événement
   */
  async getEventParticipants(eventId) {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('*, profiles(full_name, avatar_url)')
        .eq('event_id', eventId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
