import { supabase } from '../config/supabase';

/**
 * Service pour gérer les administrateurs
 * ⚠️ Ces fonctions doivent être utilisées avec précaution et uniquement par des super-admins
 */
export const adminService = {
  /**
   * Promouvoir un utilisateur au rôle d'administrateur
   * ⚠️ Cette fonction nécessite des privilèges élevés
   * En production, utilisez plutôt une fonction Supabase sécurisée
   */
  async promoteToAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: 'user',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Récupérer tous les administrateurs
   */
  async getAllAdmins() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// TEST
