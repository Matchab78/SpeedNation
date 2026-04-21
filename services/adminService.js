import { adminApi, profilesApi } from './apiService';

/**
 * Service pour gérer les administrateurs
 */
export const adminService = {
  /**
   * Récupérer les statistiques globales
   */
  async getStats() {
    try {
      const response = await adminApi.getStats();
      return { data: response?.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Récupérer la liste des utilisateurs
   */
  async getAllUsers() {
    try {
      const response = await adminApi.getUsers();
      return { data: response?.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  /**
   * Récupérer la liste des événements
   */
  async getAllEvents() {
    try {
      const response = await adminApi.getEvents();
      return { data: response?.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  /**
   * Mettre en avant ou non un événement
   */
  async toggleEventFeature(eventId, isFeatured) {
    try {
      const response = await adminApi.toggleEventFeature(eventId, isFeatured);
      return { data: response?.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Supprimer définitivement un utilisateur
   */
  async deleteUser(userId) {
    try {
      await adminApi.deleteUser(userId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Promouvoir un utilisateur au rôle d'administrateur
   */
  async promoteToAdmin(userId) {
    try {
      const { data } = await adminApi.updateUserRole(userId, 'admin');
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Rétrograder un administrateur au rôle d'utilisateur
   */
  async demoteFromAdmin(userId) {
    try {
      const { data } = await adminApi.updateUserRole(userId, 'user');
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
