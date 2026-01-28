import { supabase } from '../config/supabase';
import * as ImagePicker from 'expo-image-picker';

/**
 * Service pour gérer l'upload d'images vers Supabase Storage
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
        // Utiliser uniquement les images (valeur attendue: 'images')
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
   * Uploader une image vers Supabase Storage
   * @param {string} imageUri - URI locale de l'image
   * @param {string} bucket - Nom du bucket (avatars, car-images, event-images)
   * @param {string} fileName - Nom du fichier (optionnel, généré automatiquement si non fourni)
   * @returns {Promise<{url: string | null, error: any}>}
   */
  async uploadImage(imageUri, bucket, fileName = null) {
    try {
      // Générer un nom de fichier unique si non fourni
      if (!fileName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        fileName = `${timestamp}-${random}.jpg`;
      }

      // Lire le fichier en binaire : fetch().blob() n'existe pas en React Native,
      // on utilise XMLHttpRequest avec responseType='arraybuffer'
      const arrayBuffer = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', imageUri);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Impossible de lire le fichier image'));
        xhr.send();
      });

      // Upload vers Supabase Storage avec les données binaires
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false, // Ne pas écraser si existe déjà
        });

      if (error) {
        console.error('Erreur upload:', error);
        return { url: null, error };
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      return { url: null, error };
    }
  },

  /**
   * Uploader une photo de profil
   */
  async uploadAvatar(userId, imageUri) {
    const fileName = `avatar-${userId}-${Date.now()}.jpg`;
    return await this.uploadImage(imageUri, 'avatars', fileName);
  },

  /**
   * Uploader une photo de voiture
   */
  async uploadCarImage(carId, imageUri) {
    const fileName = `car-${carId}-${Date.now()}.jpg`;
    return await this.uploadImage(imageUri, 'car-images', fileName);
  },

  /**
   * Uploader une image d'événement
   */
  async uploadEventImage(eventId, imageUri) {
    const fileName = `event-${eventId}-${Date.now()}.jpg`;
    return await this.uploadImage(imageUri, 'event-images', fileName);
  },

  /**
   * Supprimer une image du storage
   */
  async deleteImage(bucket, fileName) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('Erreur suppression:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return { error };
    }
  },
};


