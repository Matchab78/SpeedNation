import { carsApi } from './apiService';

/**
 * Service pour gérer les voitures
 */
export const carService = {
  /**
   * Récupérer toutes les voitures
   */
  async getAllCars() {
    try {
      const { data } = await carsApi.getAll();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Récupérer toutes les voitures d'un utilisateur
   */
  async getUserCars(userId) {
    try {
      const allCars = await carsApi.getAll();
      const userCars = allCars.data.filter(car => car.user_id === userId);
      return { data: userCars, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Récupérer une voiture par son ID
   */
  async getCarById(carId) {
    try {
      const { data } = await carsApi.getById(carId);
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
      const { data } = await carsApi.create({
        user_id: userId,
        name: carData.name,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price_purchased: carData.price_purchased,
        power_hp: carData.power_hp,
        image_url: carData.image_url,
      });
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
      const { data } = await carsApi.update(carId, updates);
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
      await carsApi.delete(carId);
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
      const { data } = await carsApi.getAll();
      return { data: data.slice(0, limit), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Toggle favori
   */
  async toggleFavorite(userId, carId) {
    try {
      await carsApi.toggleFavorite(carId, userId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Ajouter une voiture aux favoris
   */
  async addToFavorites(userId, carId) {
    try {
      await carsApi.toggleFavorite(carId, userId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Retirer une voiture des favoris
   */
  async removeFromFavorites(userId, carId) {
    try {
      await carsApi.toggleFavorite(carId, userId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};

