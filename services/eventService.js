import { eventsApi } from './apiService';

/**
 * Service pour gérer les événements
 */
export const eventService = {
  /**
   * Récupérer tous les événements
   */
  async getAllEvents() {
    try {
      const { data } = await eventsApi.getAll();
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
      const { data } = await eventsApi.getById(eventId);
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
      const { data } = await eventsApi.create({
        creator_id: creatorId,
        title: eventData.title,
        description: eventData.description || null,
        event_date: eventData.event_date,
        event_time: eventData.event_time || null,
        location: eventData.location,
        image_url: eventData.image_url || null,
        visibility: eventData.visibility || 'private',
      });
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
      const { data } = await eventsApi.update(eventId, updates);
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
      await eventsApi.delete(eventId);
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
      await eventsApi.join(eventId, userId);
      return { error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Quitter un événement
   */
  async leaveEvent(userId, eventId) {
    try {
      await eventsApi.leave(eventId, userId);
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
      const { data } = await eventsApi.getById(eventId);
      const isParticipating = data.participants?.some(p => p.user_id === userId) || false;
      return { isParticipating, error: null };
    } catch (error) {
      return { isParticipating: false, error };
    }
  },

  /**
   * Récupérer les participants d'un événement
   */
  async getEventParticipants(eventId) {
    try {
      const { data } = await eventsApi.getById(eventId);
      return { data: data.participants || [], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Définir un événement comme mis en avant
   */
  async setFeaturedEvent(eventId) {
    try {
      const { adminApi } = require('./apiService');
      const { data } = await adminApi.toggleEventFeature(eventId, true);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Enlever toute mise en avant
   */
  async clearFeaturedEvent(eventId) {
    try {
      const { adminApi } = require('./apiService');
      const { data } = await adminApi.toggleEventFeature(eventId, false);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

