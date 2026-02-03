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
      // Pour le web, on utilise un input file HTML
      if (typeof window !== 'undefined' && window.document) {
        return await this.pickImageWeb();
      }

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
      // Pour le web, on utilise un input file HTML
      if (typeof window !== 'undefined' && window.document) {
        return await this.pickImageWeb();
      }

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
   * Sélectionner une image sur le web (input file HTML)
   */
  async pickImageWeb() {
    return new Promise((resolve) => {
      try {
        console.log('🎯 pickImageWeb démarré');
        console.log('🌐 Protocol:', location.protocol);
        console.log('📱 User-Agent:', navigator.userAgent);
        
        // Vérifier si on est en HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          console.error('❌ Pas HTTPS');
          resolve({
            cancelled: true,
            error: 'HTTPS requis pour accéder à la caméra/galerie.',
          });
          return;
        }

        console.log('✅ HTTPS OK, création input...');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        // iOS: essayer sans capture d'abord
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          console.log('📱 iOS détecté, configuration spéciale...');
          // Ne pas mettre capture pour iOS, laisse le choix
        } else {
          input.capture = 'environment';
        }
        
        input.onchange = (event) => {
          console.log('📁 Fichier sélectionné:', event.target.files);
          const file = event.target.files[0];
          if (file) {
            console.log('✅ Fichier trouvé:', file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
              console.log('📷 Lecture réussie');
              resolve({
                cancelled: false,
                uri: e.target.result,
                type: file.type,
                width: null,
                height: null,
                file: file,
              });
            };
            reader.onerror = () => {
              console.error('❌ Erreur lecture fichier');
              resolve({
                cancelled: true,
                error: 'Erreur lors de la lecture du fichier',
              });
            };
            reader.readAsDataURL(file);
          } else {
            console.log('❌ Aucun fichier sélectionné');
            resolve({ cancelled: true });
          }
          document.body.removeChild(input);
        };

        input.oncancel = () => {
          console.log('❌ Sélection annulée');
          resolve({ cancelled: true });
          document.body.removeChild(input);
        };

        input.onerror = (error) => {
          console.error('❌ Erreur input:', error);
          resolve({
            cancelled: true,
            error: 'Erreur lors de l\'accès au fichier',
          });
          document.body.removeChild(input);
        };

        // Forcer le click avec timeout
        setTimeout(() => {
          console.log('👆 Trigger click...');
          input.click();
        }, 100);
        
      } catch (error) {
        console.error('❌ Erreur pickImageWeb:', error);
        resolve({
          cancelled: true,
          error: `Erreur: ${error.message}`,
        });
      }
    });
  },

  /**
   * Uploader une image vers Supabase Storage
   * @param {string} imageUri - URI locale de l'image
   * @param {string} bucket - Nom du bucket (avatars, car-images, event-images)
   * @param {string} fileName - Nom du fichier (optionnel, généré automatiquement si non fourni)
   * @param {File} file - Fichier direct (pour le web)
   * @returns {Promise<{url: string | null, error: any}>}
   */
  async uploadImage(imageUri, bucket, fileName = null, file = null) {
    try {
      // Générer un nom de fichier unique si non fourni
      if (!fileName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        fileName = `${timestamp}-${random}.jpg`;
      }

      let uploadData;

      // Pour le web, utiliser directement le fichier
      if (file && typeof window !== 'undefined') {
        uploadData = file;
      } else {
        // Pour mobile natif, lire le fichier en binaire
        uploadData = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', imageUri);
          xhr.responseType = 'arraybuffer';
          xhr.onload = () => resolve(xhr.response);
          xhr.onerror = () => reject(new Error('Impossible de lire le fichier image'));
          xhr.send();
        });
      }

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, uploadData, {
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
  async uploadAvatar(userId, imageUri, file = null) {
    const fileName = `avatar-${userId}-${Date.now()}.jpg`;
    return await this.uploadImage(imageUri, 'avatars', fileName, file);
  },

  /**
   * Uploader une photo de voiture
   */
  async uploadCarImage(carId, imageUri, file = null) {
    const fileName = `car-${carId}-${Date.now()}.jpg`;
    return await this.uploadImage(imageUri, 'car-images', fileName, file);
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


