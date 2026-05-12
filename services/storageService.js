import * as ImagePicker from 'expo-image-picker';
import { storageApi } from './apiService';

/**
 * Service pour gérer l'upload d'images
 * NOTE: Le stockage d'images nécessite une solution externe (AWS S3, Cloudinary, etc.)
 * Ce service est actuellement désactivé car nous utilisons PostgreSQL au lieu de Supabase
 */
export const storageService = {
  /**
   * Demander les permissions pour accéder à la galerie/appareil photo
   */
  async requestPermissions() {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return {
        camera: cameraStatus === 'granted',
        gallery: galleryStatus === 'granted',
      };
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return { camera: false, gallery: false };
    }
  },

  /**
   * Sélectionner une image depuis la galerie
   */
  async pickImageFromGallery() {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.gallery) {
        return {
          cancelled: true,
          error: 'Permission refusée pour accéder à la galerie',
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return { cancelled: true };
      }

      return {
        cancelled: false,
        uri: result.assets[0].uri,
        type: result.assets[0].type,
        width: result.assets[0].width,
        height: result.assets[0].height,
      };
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      return {
        cancelled: true,
        error: error.message,
      };
    }
  },

  /**
   * Prendre une photo avec l'appareil photo
   */
  async takePhoto() {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        return {
          cancelled: true,
          error: 'Permission refusée pour accéder à l\'appareil photo',
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return { cancelled: true };
      }

      return {
        cancelled: false,
        uri: result.assets[0].uri,
        type: result.assets[0].type,
        width: result.assets[0].width,
        height: result.assets[0].height,
      };
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      return {
        cancelled: true,
        error: error.message,
      };
    }
  },

  /**
   * Uploader une image vers le stockage local
   */
  async uploadImage(imageUri, bucket) {
    try {
      const response = await storageApi.upload(imageUri, bucket);
      
      if (response && response.data && response.data.url) {
        // L'URL retournée est relative (ex: /uploads/avatars/xxx.jpg)
        // On construit l'URL absolue en utilisant l'origine actuelle
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const fullUrl = `${baseUrl}${response.data.url}`;
        
        console.log('[Storage] Full image URL:', fullUrl);
        return { url: fullUrl, error: null };
      }
      
      return { url: null, error: { message: 'Réponse invalide du serveur' } };
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      return { url: null, error: { message: error.message || 'Erreur lors de l\'upload' } };
    }
  },

  /**
   * Uploader une photo de profil
   */
  async uploadAvatar(userId, imageUri) {
    return await this.uploadImage(imageUri, 'avatars');
  },

  /**
   * Uploader une photo de voiture
   */
  async uploadCarImage(carId, imageUri) {
    return await this.uploadImage(imageUri, 'car-images');
  },

  /**
   * Uploader une image d'événement
   */
  async uploadEventImage(eventId, imageUri) {
    return await this.uploadImage(imageUri, 'event-images');
  },

  /**
   * Supprimer une image du storage (non implémenté)
   */
  async deleteImage(bucket, fileName) {
    console.warn('Storage non implémenté');
    return { error: { message: 'Storage non implémenté' } };
  },
};


