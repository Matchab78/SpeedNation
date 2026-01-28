import { supabase } from '../config/supabase';

/**
 * Service pour gérer les voitures
 */
export const carService = {
  /**
   * Récupérer toutes les voitures d'un utilisateur
   */
  async getUserCars(userId) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Récupérer une voiture par son ID
   */
  async getCarById(carId) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*, profiles(full_name, avatar_url)')
        .eq('id', carId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Ajouter une nouvelle voiture
   */
  async addCar(userId, carData) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .insert({
          user_id: userId,
          name: carData.name,
          brand: carData.brand,
          model: carData.model,
          year: carData.year,
          price_purchased: carData.price_purchased,
          power_hp: carData.power_hp,
          image_url: carData.image_url,
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
   * Mettre à jour une voiture
   */
  async updateCar(carId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', carId)
        .eq('user_id', userId) // Sécurité : s'assurer que c'est bien la voiture de l'utilisateur
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Supprimer une voiture
   */
  async deleteCar(carId, userId) {
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)
        .eq('user_id', userId); // Sécurité

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Récupérer les dernières voitures ajoutées (tous utilisateurs)
   */
  async getLatestCars(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Ajouter une voiture aux favoris
   */
  async addToFavorites(userId, carId) {
    try {
      const { data, error } = await supabase
        .from('car_favorites')
        .insert({
          user_id: userId,
          car_id: carId,
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
   * Retirer une voiture des favoris
   */
  async removeFromFavorites(userId, carId) {
    try {
      const { error } = await supabase
        .from('car_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('car_id', carId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Récupérer les voitures favorites d'un utilisateur
   */
  async getFavoriteCars(userId) {
    try {
      const { data, error } = await supabase
        .from('car_favorites')
        .select('*, cars(*, profiles(full_name, avatar_url))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
