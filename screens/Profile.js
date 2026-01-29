import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { useAuth } from "../utils/authContext";
import { carService } from "../services/carService";
import { authService } from "../services/authService";
import { storageService } from "../services/storageService";

export default function Profile({ navigation }) {
  const { user, profile, refreshUser, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("cars");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [editingCarId, setEditingCarId] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCar, setNewCar] = useState({
    name: "",
    brand: "",
    model: "",
    year: "",
    price_purchased: "",
    power_hp: "",
    image_url: "",
    imageUri: null,
  });
  const [editCar, setEditCar] = useState({
    name: "",
    brand: "",
    model: "",
    year: "",
    price_purchased: "",
    power_hp: "",
    image_url: "",
    imageUri: null,
  });
  const [editProfile, setEditProfile] = useState({
    full_name: "",
    profession: "",
    location: "",
    age: "",
    avatarUri: null,
    showAdminRole: true,
  });

  useEffect(() => {
    if (user) {
      loadCars();
      if (profile) {
        setEditProfile({
          full_name: profile.full_name || "",
          profession: profile.profession || "",
          location: profile.location || "",
          age: profile.age ? profile.age.toString() : "",
          avatarUri: null,
          showAdminRole: profile.show_admin_role === false ? false : true,
        });
      }
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const loadCars = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await carService.getUserCars(user.id);
      if (error) {
        console.error("Erreur lors du chargement des voitures:", error);
        Alert.alert("Erreur", "Impossible de charger vos voitures");
      } else {
        setCars(data || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCarImage = async () => {
    Alert.alert(
      "Sélectionner une image",
      "Choisissez une source",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Galerie",
          onPress: async () => {
            const result = await storageService.pickImageFromGallery();
            if (!result.cancelled && result.uri) {
              setNewCar((c) => ({ ...c, imageUri: result.uri }));
            } else if (result.error) {
              Alert.alert("Erreur", result.error);
            }
          },
        },
        {
          text: "Appareil photo",
          onPress: async () => {
            const result = await storageService.takePhoto();
            if (!result.cancelled && result.uri) {
              setNewCar((c) => ({ ...c, imageUri: result.uri }));
            } else if (result.error) {
              Alert.alert("Erreur", result.error);
            }
          },
        },
      ]
    );
  };

  const handleSelectEditCarImage = async () => {
    Alert.alert(
      "Sélectionner une image",
      "Choisissez une source",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Galerie",
          onPress: async () => {
            const result = await storageService.pickImageFromGallery();
            if (!result.cancelled && result.uri) {
              setEditCar((c) => ({ ...c, imageUri: result.uri }));
            } else if (result.error) {
              Alert.alert("Erreur", result.error);
            }
          },
        },
        {
          text: "Appareil photo",
          onPress: async () => {
            const result = await storageService.takePhoto();
            if (!result.cancelled && result.uri) {
              setEditCar((c) => ({ ...c, imageUri: result.uri }));
            } else if (result.error) {
              Alert.alert("Erreur", result.error);
            }
          },
        },
      ]
    );
  };

  const handleOpenEditCar = (item) => {
    setEditingCarId(item.id);
    setEditCar({
      name: item.name || "",
      brand: item.brand || "",
      model: item.model || "",
      year: item.year ? String(item.year) : "",
      price_purchased: item.price_purchased ? String(item.price_purchased) : "",
      power_hp: item.power_hp ? String(item.power_hp) : "",
      image_url: item.image_url || "",
      imageUri: null,
    });
    setShowEditCarModal(true);
  };

  const handleUpdateCar = async () => {
    if (!editingCarId) return;
    if (!editCar.name.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom de la voiture");
      return;
    }
    if (!editCar.price_purchased || parseFloat(editCar.price_purchased) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un prix valide");
      return;
    }
    if (!editCar.power_hp || parseInt(editCar.power_hp) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une puissance valide");
      return;
    }

    setUploadingImage(true);
    try {
      let imageUrl = editCar.image_url.trim() || null;

      if (editCar.imageUri) {
        const { url, error: uploadError } = await storageService.uploadCarImage(
          editingCarId,
          editCar.imageUri
        );
        if (uploadError) {
          Alert.alert("Erreur", "Impossible d'uploader l'image");
          setUploadingImage(false);
          return;
        }
        imageUrl = url;
      }

      const updates = {
        name: editCar.name.trim(),
        brand: editCar.brand.trim() || null,
        model: editCar.model.trim() || null,
        year: editCar.year ? parseInt(editCar.year) : null,
        price_purchased: parseFloat(editCar.price_purchased),
        power_hp: parseInt(editCar.power_hp),
        image_url: imageUrl,
      };

      const { error } = await carService.updateCar(editingCarId, user.id, updates);
      if (error) {
        Alert.alert("Erreur", "Impossible de modifier la voiture");
        setUploadingImage(false);
        return;
      }

      Alert.alert("Succès", "Voiture modifiée avec succès !");
      setShowEditCarModal(false);
      setEditingCarId(null);
      loadCars();
    } catch (err) {
      Alert.alert("Erreur", "Une erreur est survenue");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCar = async () => {
    if (!newCar.name.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom de la voiture");
      return;
    }
    if (!newCar.price_purchased || parseFloat(newCar.price_purchased) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un prix valide");
      return;
    }
    if (!newCar.power_hp || parseInt(newCar.power_hp) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une puissance valide");
      return;
    }

    setUploadingImage(true);

    try {
      let imageUrl = newCar.image_url.trim() || null;

      if (newCar.imageUri) {
        const { url, error: uploadError } = await storageService.uploadCarImage(
          `temp-${Date.now()}`,
          newCar.imageUri
        );
        if (uploadError) {
          Alert.alert("Erreur", "Impossible d'uploader l'image");
          setUploadingImage(false);
          return;
        }
        imageUrl = url;
      }

      const carData = {
        name: newCar.name.trim(),
        brand: newCar.brand.trim() || null,
        model: newCar.model.trim() || null,
        year: newCar.year ? parseInt(newCar.year) : null,
        price_purchased: parseFloat(newCar.price_purchased),
        power_hp: parseInt(newCar.power_hp),
        image_url: imageUrl,
      };

      const { data, error } = await carService.addCar(user.id, carData);

      if (error) {
        Alert.alert("Erreur", "Impossible d'ajouter la voiture");
        setUploadingImage(false);
        return;
      }

      Alert.alert("Succès", "Voiture ajoutée avec succès !");
      setShowAddModal(false);
      setNewCar({
        name: "",
        brand: "",
        model: "",
        year: "",
        price_purchased: "",
        power_hp: "",
        image_url: "",
        imageUri: null,
      });
      loadCars();
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSelectAvatar = async () => {
    Alert.alert(
      "Sélectionner une photo",
      "Choisissez une source",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Galerie",
          onPress: async () => {
            const result = await storageService.pickImageFromGallery();
            if (!result.cancelled && result.uri) {
              setEditProfile({ ...editProfile, avatarUri: result.uri });
            } else if (result.error) {
              Alert.alert("Erreur", result.error);
            }
          },
        },
        {
          text: "Appareil photo",
          onPress: async () => {
            const result = await storageService.takePhoto();
            if (!result.cancelled && result.uri) {
              setEditProfile({ ...editProfile, avatarUri: result.uri });
            } else if (result.error) {
              Alert.alert("Erreur", result.error);
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    setUploadingImage(true);

    try {
      let avatarUrl = profile?.avatar_url || null;

      if (editProfile.avatarUri) {
        const { url, error: uploadError } = await storageService.uploadAvatar(
          user.id,
          editProfile.avatarUri
        );
        if (uploadError) {
          Alert.alert(
            "Erreur upload",
            uploadError.message || "Impossible d'uploader la photo de profil"
          );
          setUploadingImage(false);
          return;
        }
        avatarUrl = url;
      }

      const updates = {
        full_name: editProfile.full_name.trim() || null,
        profession: editProfile.profession.trim() || null,
        location: editProfile.location.trim() || null,
        age: editProfile.age ? parseInt(editProfile.age) : null,
        avatar_url: avatarUrl,
        show_admin_role: editProfile.showAdminRole,
      };

      const { error } = await authService.updateProfile(user.id, updates);

      if (error) {
        Alert.alert("Erreur", "Impossible de mettre à jour le profil");
        setUploadingImage(false);
        return;
      }

      Alert.alert("Succès", "Profil mis à jour avec succès !");
      setShowEditProfileModal(false);
      refreshUser();
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteCar = (carId) => {
    Alert.alert(
      "Supprimer la voiture",
      "Êtes-vous sûr de vouloir supprimer cette voiture ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const { error } = await carService.deleteCar(carId, user.id);
            if (error) {
              Alert.alert("Erreur", "Impossible de supprimer la voiture");
            } else {
              loadCars();
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderCarCard = ({ item }) => (
    <View style={styles.carCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.carImage} resizeMode="cover" />
      ) : (
        <View style={[styles.carImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>🚗</Text>
        </View>
      )}

      <View style={styles.carInfoContainer}>
        <Text style={styles.carTitle}>{item.name}</Text>
        <Text style={styles.carDetails}>
          {formatPrice(item.price_purchased)} • {item.power_hp} Ch
        </Text>
        {item.brand && item.model && (
          <Text style={styles.carSubDetails}>
            {item.brand} {item.model} {item.year ? `• ${item.year}` : ""}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.carCardMenuButton}
        onPress={() =>
          Alert.alert(item.name, undefined, [
            { text: "Annuler", style: "cancel" },
            { text: "Modifier", onPress: () => handleOpenEditCar(item) },
            {
              text: "Supprimer",
              style: "destructive",
              onPress: () => handleDeleteCar(item.id),
            },
          ])
        }
      >
        <Text style={styles.carCardMenuText}>☰</Text>
      </TouchableOpacity>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInText}>
            Veuillez vous connecter pour voir vos voitures
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8916CB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        {isAdmin && (
          <TouchableOpacity
            style={styles.profileAdminButton}
            onPress={() => navigation.navigate('AdminPanel')}
          >
            <Text style={styles.menuText}>⚙︎</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.profileMenuButton}
          onPress={() => setShowEditProfileModal(true)}
        >
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowEditProfileModal(true)}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profile?.full_name
                  ? profile.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.name}>
          {profile?.full_name || user?.email || "Utilisateur"}
        </Text>
        <Text style={styles.info}>
          {profile?.profession || "Utilisateur"}
        </Text>
        {(profile?.location || profile?.age) && (
          <Text style={styles.info}>
            {profile?.location}
            {profile?.location && profile?.age ? " — " : ""}
            {profile?.age ? `${profile.age} ans` : ""}
          </Text>
        )}
        {profile?.followers_count !== undefined && (
          <Text style={styles.followers}>
            {profile.followers_count.toLocaleString()} FOLLOWERS
          </Text>
        )}
        {isAdmin && profile?.show_admin_role !== false && (
          <View style={styles.adminBadge}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>ADMIN</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab("cars")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "cars" && styles.activeTabText,
            ]}
          >
            MES VOITURES
          </Text>
        </TouchableOpacity>
      </View>

      {cars.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucune voiture ajoutée</Text>
          <Text style={styles.emptyStateSubtext}>
            Appuyez sur + pour ajouter une voiture
          </Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={renderCarCard}
          contentContainerStyle={styles.carsListContent}
          refreshing={loading}
          onRefresh={loadCars}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Modals layout is identical to CarsScreen, styles reused */}
      {/* Add Car Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScrollContent}>
                  <Text style={styles.modalTitle}>Ajouter une voiture</Text>

                  <TextInput style={styles.modalInput} placeholder="Nom complet (ex: Porsche 911 GT3 • 2023)" placeholderTextColor="#888" value={newCar.name} onChangeText={(text) => setNewCar({ ...newCar, name: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Marque (optionnel)" placeholderTextColor="#888" value={newCar.brand} onChangeText={(text) => setNewCar({ ...newCar, brand: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Modèle (optionnel)" placeholderTextColor="#888" value={newCar.model} onChangeText={(text) => setNewCar({ ...newCar, model: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Année (optionnel)" placeholderTextColor="#888" keyboardType="numeric" value={newCar.year} onChangeText={(text) => setNewCar({ ...newCar, year: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Prix d'achat (€)" placeholderTextColor="#888" keyboardType="numeric" value={newCar.price_purchased} onChangeText={(text) => setNewCar({ ...newCar, price_purchased: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Puissance (chevaux)" placeholderTextColor="#888" keyboardType="numeric" value={newCar.power_hp} onChangeText={(text) => setNewCar({ ...newCar, power_hp: text })} returnKeyType="next" />

                  <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectCarImage}>
                    {newCar.imageUri ? (
                      <Image source={{ uri: newCar.imageUri }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Text style={styles.imagePickerText}>📷</Text>
                        <Text style={styles.imagePickerLabel}>{newCar.image_url ? "Image URL (cliquez pour changer)" : "Ajouter une photo"}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {newCar.imageUri && (
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setNewCar({ ...newCar, imageUri: null })}>
                      <Text style={styles.removeImageText}>Supprimer l'image</Text>
                    </TouchableOpacity>
                  )}

                  <TextInput style={styles.modalInput} placeholder="Ou URL de l'image (optionnel)" placeholderTextColor="#888" value={newCar.image_url} onChangeText={(text) => setNewCar({ ...newCar, image_url: text })} returnKeyType="done" />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowAddModal(false)}>
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.addButtonModal]} onPress={handleAddCar} disabled={uploadingImage}>
                      {uploadingImage ? <ActivityIndicator color="white" /> : <Text style={styles.addButtonModalText}>Ajouter</Text>}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Car Modal */}
      <Modal visible={showEditCarModal} animationType="slide" transparent onRequestClose={() => { setShowEditCarModal(false); setEditingCarId(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowEditCarModal(false); setEditingCarId(null); }}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScrollContent}>
                  <Text style={styles.modalTitle}>Modifier la voiture</Text>

                  <TextInput style={styles.modalInput} placeholder="Nom complet (ex: Porsche 911 GT3 • 2023)" placeholderTextColor="#888" value={editCar.name} onChangeText={(text) => setEditCar({ ...editCar, name: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Marque (optionnel)" placeholderTextColor="#888" value={editCar.brand} onChangeText={(text) => setEditCar({ ...editCar, brand: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Modèle (optionnel)" placeholderTextColor="#888" value={editCar.model} onChangeText={(text) => setEditCar({ ...editCar, model: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Année (optionnel)" placeholderTextColor="#888" keyboardType="numeric" value={editCar.year} onChangeText={(text) => setEditCar({ ...editCar, year: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Prix d'achat (€)" placeholderTextColor="#888" keyboardType="numeric" value={editCar.price_purchased} onChangeText={(text) => setEditCar({ ...editCar, price_purchased: text })} returnKeyType="next" />

                  <TextInput style={styles.modalInput} placeholder="Puissance (chevaux)" placeholderTextColor="#888" keyboardType="numeric" value={editCar.power_hp} onChangeText={(text) => setEditCar({ ...editCar, power_hp: text })} returnKeyType="next" />

                  <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectEditCarImage}>
                    {editCar.imageUri ? (
                      <Image source={{ uri: editCar.imageUri }} style={styles.previewImage} />
                    ) : editCar.image_url ? (
                      <Image source={{ uri: editCar.image_url }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Text style={styles.imagePickerText}>📷</Text>
                        <Text style={styles.imagePickerLabel}>Changer la photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {(editCar.imageUri || editCar.image_url) && (
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setEditCar((c) => ({ ...c, imageUri: null, image_url: "" }))}>
                      <Text style={styles.removeImageText}>Supprimer l'image</Text>
                    </TouchableOpacity>
                  )}

                  <TextInput style={styles.modalInput} placeholder="Ou URL de l'image (optionnel)" placeholderTextColor="#888" value={editCar.image_url} onChangeText={(text) => setEditCar({ ...editCar, image_url: text })} returnKeyType="done" />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setShowEditCarModal(false); setEditingCarId(null); }}>
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.addButtonModal]} onPress={handleUpdateCar} disabled={uploadingImage}>
                      {uploadingImage ? <ActivityIndicator color="white" /> : <Text style={styles.addButtonModalText}>Enregistrer</Text>}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfileModal} animationType="slide" transparent onRequestClose={() => setShowEditProfileModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditProfileModal(false)}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScrollContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Modifier mon profil</Text>
                    <TouchableOpacity
                      style={styles.modalClose}
                      onPress={() => setShowEditProfileModal(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Fermer"
                    >
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.avatarPickerButton} onPress={handleSelectAvatar}>
                    {editProfile.avatarUri ? (
                      <Image source={{ uri: editProfile.avatarUri }} style={styles.avatarPreview} />
                    ) : profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.avatarPreview} />
                    ) : (
                      <View style={styles.avatarPreviewPlaceholder}>
                        <Text style={styles.avatarPreviewText}>
                          {editProfile.full_name
                            ? editProfile.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "U"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.changeAvatarBadge}>
                    <Text style={styles.changeAvatarText}>✚</Text>
                  </View>

                  <TextInput style={styles.modalInput} placeholder="Nom complet" placeholderTextColor="#888" value={editProfile.full_name} onChangeText={(text) => setEditProfile({ ...editProfile, full_name: text })} />

                  <TextInput style={styles.modalInput} placeholder="Profession" placeholderTextColor="#888" value={editProfile.profession} onChangeText={(text) => setEditProfile({ ...editProfile, profession: text })} />

                  <TextInput style={styles.modalInput} placeholder="Lieu" placeholderTextColor="#888" value={editProfile.location} onChangeText={(text) => setEditProfile({ ...editProfile, location: text })} />

                  <TextInput style={styles.modalInput} placeholder="Âge" placeholderTextColor="#888" keyboardType="numeric" value={editProfile.age} onChangeText={(text) => setEditProfile({ ...editProfile, age: text })} />

                  {isAdmin && (
                    <View style={{
                      backgroundColor: '#0a0a0a',
                      borderRadius: 12,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#1a1a1a',
                      marginBottom: 14,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Afficher le badge administrateur</Text>
                        <Switch
                          value={editProfile.showAdminRole}
                          onValueChange={(v) => setEditProfile({ ...editProfile, showAdminRole: v })}
                        />
                      </View>

                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowEditProfileModal(false)}>
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.addButtonModal]} onPress={handleUpdateProfile} disabled={uploadingImage}>
                      {uploadingImage ? <ActivityIndicator color="white" /> : <Text style={styles.addButtonModalText}>Enregistrer</Text>}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.logoutLink} onPress={() => {
                    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
                      { text: "Annuler", style: "cancel" },
                      { text: "Se déconnecter", style: "destructive", onPress: async () => { setShowEditProfileModal(false); await signOut(); } },
                    ]);
                  }}>
                    <Text style={styles.logoutLinkText}>Se déconnecter</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 55,
  },
  notLoggedIn: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  notLoggedInText: { color: "#fff", fontSize: 16, marginBottom: 20, textAlign: "center" },
  loginButton: { backgroundColor: "#8916CB", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, borderWidth: 1, borderColor: "rgba(137, 22, 203, 0.4)" },
  loginButtonText: { color: "#fff", fontWeight: "600" },
  profileCard: { backgroundColor: "transparent", paddingVertical: 24, paddingHorizontal: 20, marginBottom: 20, alignItems: "center" },
  profileAdminButton: { position: "absolute", top: 0, left: 0, padding: 12 },
  profileMenuButton: { position: "absolute", top: 0, right: 0, padding: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: "#8916CB", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  info: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 2 },
  followers: { color: "#888", fontWeight: "600", marginTop: 6, fontSize: 12, letterSpacing: 1 },
  adminBadge: { marginTop: 8, backgroundColor: "#1a0a2e", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#2a1a3a" },
  menuText: { fontSize: 24, color: "#fff" },
  tabs: { flexDirection: "row", justifyContent: "space-evenly", marginBottom: 16, paddingHorizontal: 20 },
  tabText: { color: "#666", fontSize: 15, fontWeight: "500" },
  activeTabText: { color: "#8916CB", fontWeight: "bold", borderBottomWidth: 2, borderBottomColor: "#8916CB", paddingBottom: 4 },
  fab: { position: "absolute", bottom: 90, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(137, 22, 203, 0.9)", alignItems: "center", justifyContent: "center", ...(Platform.OS === 'ios' ? { shadowColor: "#8916CB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 } : { elevation: 4 }) },
  fabIcon: { color: "#fff", fontSize: 26, fontWeight: "300" },
  carsListContent: { paddingBottom: 140 },
  carCard: { backgroundColor: "#111", marginHorizontal: 20, borderRadius: 16, marginBottom: 14, padding: 16, flexDirection: "row", alignItems: "center" },
  carImage: { width: 120, height: 80, borderRadius: 12 },
  placeholderImage: { backgroundColor: "#1a0a2e", justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 36 },
  carInfoContainer: { flex: 1, marginLeft: 14 },
  carTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  carDetails: { color: "#888", marginTop: 4, fontSize: 14 },
  carSubDetails: { color: "#888", marginTop: 2, fontSize: 12 },
  carCardMenuButton: { padding: 10, marginLeft: 4 },
  carCardMenuText: { fontSize: 20, color: "#ccc" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyStateText: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 10 },
  emptyStateSubtext: { color: "#888", fontSize: 14, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.85)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#050505",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
  },
  modalScrollContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 0,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  modalCloseText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modalInput: {
    backgroundColor: "#0a0a0a",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cancelButton: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },

  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },

  addButtonModal: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#2a1a3a",
  },

  addButtonModalText: {
    color: "#b8a3ff",
    fontWeight: "600",
    fontSize: 16,
  },
  imagePickerButton: { marginBottom: 12, borderRadius: 12, overflow: "hidden" },
  previewImage: { width: "100%", height: 200, borderRadius: 12 },
  imagePickerPlaceholder: {
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1a1a1a",
    borderStyle: "dashed",
  },
  imagePickerText: { fontSize: 40, marginBottom: 10 },
  imagePickerLabel: { color: "#888", fontSize: 14 },
  removeImageButton: { backgroundColor: "#ff4444", paddingVertical: 8, borderRadius: 8, alignItems: "center", marginBottom: 12 },
  removeImageText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  avatarPickerButton: { alignSelf: "center", marginBottom: 20, position: "relative" },
  avatarPreview: { width: 120, height: 120, borderRadius: 60 },
  avatarPreviewPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#8916CB", justifyContent: "center", alignItems: "center" },
  avatarPreviewText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  changeAvatarBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#8916CB", borderRadius: 20, width: 40, height: 40, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#111" },
  changeAvatarText: { fontSize: 20 },
  logoutLink: { alignSelf: "center", paddingVertical: 16, marginTop: 8 },
  logoutLinkText: { color: "#666", fontSize: 13 },
});
