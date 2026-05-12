import { authApi } from './apiService';

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(email, password, userData = {}) {
    try {
      console.log('authService.signUp called with:', { email, password: password ? '***' : undefined, userData });
      const response = await authApi.signUp(email, password, userData.full_name || null, userData.profession || null, userData.location || null, userData.age || null);
      console.log('authService.signUp response:', response);
      
      const user = response?.data;
      if (user) {
        // Auto-login after sign-up
        return await this.signIn(email, password);
      }
      return { data: null, error: new Error('Réponse invalide du serveur') };
    } catch (error) {
      console.error('authService.signUp error:', error);
      return { data: null, error };
    }
  },

  /**
   * Connexion d'un utilisateur
   */
  async signIn(email, password) {
    try {
      console.log('authService.signIn called for:', email);
      const response = await authApi.signIn(email, password);
      console.log('authService.signIn raw response:', response);
      
      const user = response?.data?.user;
      if (user) {
        console.log('authService.signIn success, user found:', user.email);
        localStorage.setItem('user', JSON.stringify(user));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-status-changed'));
        }
        return { data: { user }, error: null };
      }
      console.warn('authService.signIn failed: no user in response');
      return { data: null, error: new Error('Réponse invalide du serveur') };
    } catch (error) {
      console.error('authService.signIn error:', error);
      return { data: null, error };
    }
  },

  /**
   * Déconnexion
   */
  async signOut() {
    try {
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-status-changed'));
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Récupérer l'utilisateur actuel
   */
  async getCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  /**
   * Récupérer le profil complet de l'utilisateur
   */
  async getUserProfile(userId) {
    try {
      const data = await authApi.getUser(userId);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(userId, updates) {
    try {
      const { profilesApi } = require('./apiService');
      const data = await profilesApi.update(userId, updates);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Vérifier si un utilisateur est administrateur
   */
  async isAdmin(userId) {
    try {
      const { profilesApi } = require('./apiService');
      const response = await profilesApi.getById(userId);
      // Le backend renvoie { data: { role: '...' } }
      const role = response?.data?.role;
      console.log(`authService.isAdmin check for ${userId}: role is ${role}`);
      return { isAdmin: role === 'admin', error: null };
    } catch (error) {
      console.error('authService.isAdmin error:', error);
      return { isAdmin: false, error };
    }
  },

  /**
   * Récupérer le rôle d'un utilisateur
   */
  async getUserRole(userId) {
    try {
      const { profilesApi } = require('./apiService');
      const response = await profilesApi.getById(userId);
      const role = response?.data?.role || 'user';
      return { role, error: null };
    } catch (error) {
      return { role: null, error };
    }
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(userId, newPassword) {
    try {
      const response = await authApi.changePassword(userId, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('authService.changePassword error:', error);
      return { success: false, error };
    }
  },

  /**
   * Réinitialisation admin (réservé aux admins)
   */
  async adminResetPassword(userId, temporaryPassword) {
    try {
      const { adminApi } = require('./apiService');
      await adminApi.resetUserPassword(userId, temporaryPassword);
      return { success: true };
    } catch (error) {
      console.error('authService.adminResetPassword error:', error);
      return { success: false, error };
    }
  },

  /**
   * Demander une réinitialisation de mot de passe
   */
  async resetPassword(email) {
    // Non implémenté pour l'instant
    return { data: null, error: { message: 'Non implémenté' } };
  },
};

