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
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../utils/authContext";
import { carService } from "../services/carService";
import { authService } from "../services/authService";
import { storageService } from "../services/storageService";
import { getImageUrl } from "../services/apiService";

export default function CarsScreen({ navigation }) {
  const { user, profile, refreshUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("cars");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [editingCarId, setEditingCarId] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [newCar, setNewCar] = useState({
    name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null,
  });
  const [editCar, setEditCar] = useState({
    name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null,
  });
  const [editProfile, setEditProfile] = useState({
    full_name: "", profession: "", location: "", age: "", avatarUri: null, showAdminRole: true,
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
          showAdminRole: profile.show_admin_role === false ? false : profile.role === "admin",
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
      if (!error) setCars(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (mode, type = 'newCar') => {
    try {
      const result = mode === 'gallery' 
        ? await storageService.pickImageFromGallery() 
        : await storageService.takePhoto();

      if (!result.cancelled && result.uri) {
        if (type === 'newCar') setNewCar({ ...newCar, imageUri: result.uri });
        else if (type === 'editCar') setEditCar({ ...editCar, imageUri: result.uri });
        else if (type === 'editProfile') setEditProfile({ ...editProfile, avatarUri: result.uri });
      } else if (result.error) {
        Alert.alert("Erreur", "L'accès aux photos est peut-être bloqué par votre navigateur (HTTPS requis sur mobile).");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async () => {
    setUploadingImage(true);
    try {
      let avatarUrl = profile?.avatar_url || null;
      if (editProfile.avatarUri) {
        const { url, error: uploadError } = await storageService.uploadAvatar(user.id, editProfile.avatarUri);
        if (uploadError) throw uploadError;
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
      if (error) throw error;

      Alert.alert("Succès", "Profil mis à jour !");
      setShowEditProfileModal(false);
      refreshUser();
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCar = async () => {
     if (!newCar.name.trim()) return Alert.alert("Erreur", "Nom requis");
     setUploadingImage(true);
     try {
       let imageUrl = newCar.image_url.trim() || null;
       if (newCar.imageUri) {
         const { url, error } = await storageService.uploadCarImage(`temp-${Date.now()}`, newCar.imageUri);
         if (error) throw error;
         imageUrl = url;
       }
       await carService.addCar(user.id, { 
           ...newCar, 
           image_url: imageUrl,
           price_purchased: parseFloat(newCar.price_purchased || 0),
           power_hp: parseInt(newCar.power_hp || 0),
           year: parseInt(newCar.year || 0)
        });
       setShowAddModal(false);
       loadCars();
     } catch (e) { Alert.alert("Erreur", "Échec ajout"); }
     finally { setUploadingImage(false); }
  };

  const renderCarCard = ({ item }) => (
    <View style={styles.carCard}>
      <Image source={{ uri: getImageUrl(item.image_url) || 'https://via.placeholder.com/150' }} style={styles.carImage} />
      <View style={styles.carInfoContainer}>
        <Text style={styles.carTitle}>{item.name}</Text>
        <Text style={styles.carDetails}>{item.price_purchased}€ • {item.power_hp} Ch</Text>
      </View>
      <TouchableOpacity style={styles.carCardMenuButton} onPress={() => {
          Alert.alert(item.name, "", [
            { text: "Annuler", style: "cancel" },
            { text: "Modifier", onPress: () => {
                setEditingCarId(item.id);
                setEditCar({...item, year: item.year?.toString() || "", price_purchased: item.price_purchased?.toString() || "", power_hp: item.power_hp?.toString() || "", imageUri: null});
                setShowEditCarModal(true);
            }},
            { text: "Supprimer", style: "destructive", onPress: async () => { await carService.deleteCar(item.id, user.id); loadCars(); }}
          ]);
      }}>
        <Text style={styles.carCardMenuText}>☰</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#8916CB" /></View>;

  return (
    <View style={styles.container}>
      {/* --- HEADER PROFIL PREMIUM --- */}
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.profileMenuButton} onPress={() => setShowEditProfileModal(true)}>
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity style={styles.adminPanelButton} onPress={() => navigation.navigate("AdminPanel")}>
            <Text style={styles.adminPanelIcon}>⛨</Text>
            <Text style={styles.adminPanelText}>Panel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setShowEditProfileModal(true)}>
          <Image source={{ uri: getImageUrl(profile?.avatar_url) || 'https://via.placeholder.com/100' }} style={styles.avatar} />
        </TouchableOpacity>

        <Text style={styles.name}>{profile?.full_name || user?.email}</Text>
        <Text style={styles.info}>{profile?.profession || "Passionné automobile"}</Text>
        <Text style={styles.info}>{profile?.location} {profile?.age ? `• ${profile.age} ans` : ""}</Text>
        <Text style={styles.followers}>{profile?.followers_count || 0} FOLLOWERS</Text>

        {isAdmin && profile?.show_admin_role !== false && (
          <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>Administrateur</Text></View>
        )}
      </View>

      {/* --- TABS --- */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab("cars")}>
          <Text style={[styles.tabText, activeTab === "cars" && styles.activeTabText]}>MES VOITURES</Text>
        </TouchableOpacity>
      </View>

      {/* --- LISTE + FAB dans un wrapper flex:1 --- */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={renderCarCard}
          contentContainerStyle={[styles.carsListContent, { paddingBottom: 100 }]}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune voiture ajoutée</Text>}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setNewCar({ name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null });
            setShowAddModal(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODAL AJOUTER VOITURE --- */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Ajouter une voiture</Text>
              <TextInput style={styles.modalInput} placeholder="Nom de la voiture *" placeholderTextColor="#666" value={newCar.name} onChangeText={t => setNewCar({...newCar, name: t})} />
              <TextInput style={styles.modalInput} placeholder="Marque" placeholderTextColor="#666" value={newCar.brand} onChangeText={t => setNewCar({...newCar, brand: t})} />
              <TextInput style={styles.modalInput} placeholder="Modèle" placeholderTextColor="#666" value={newCar.model} onChangeText={t => setNewCar({...newCar, model: t})} />
              <TextInput style={styles.modalInput} placeholder="Année" keyboardType="numeric" placeholderTextColor="#666" value={newCar.year} onChangeText={t => setNewCar({...newCar, year: t})} />
              <TextInput style={styles.modalInput} placeholder="Prix d'achat (€)" keyboardType="numeric" placeholderTextColor="#666" value={newCar.price_purchased} onChangeText={t => setNewCar({...newCar, price_purchased: t})} />
              <TextInput style={styles.modalInput} placeholder="Puissance (ch)" keyboardType="numeric" placeholderTextColor="#666" value={newCar.power_hp} onChangeText={t => setNewCar({...newCar, power_hp: t})} />
              <View style={styles.imageSelectorRow}>
                <TouchableOpacity style={styles.imageBtnLarge} onPress={() => pickImage('gallery', 'newCar')}>
                  <Ionicons name="images" size={24} color="#fff" />
                  <Text style={{color:'#fff'}}>Galerie</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageBtnLarge} onPress={() => pickImage('camera', 'newCar')}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={{color:'#fff'}}>Photo</Text>
                </TouchableOpacity>
              </View>
              {newCar.imageUri && <Image source={{uri: newCar.imageUri}} style={{width:'100%', height:150, borderRadius:12, marginBottom:10}} />}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButtonModal} onPress={handleAddCar} disabled={uploadingImage}>
                  {uploadingImage ? <ActivityIndicator color="#fff" /> : <Text style={styles.addText}>Ajouter</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL EDIT PROFIL --- */}
      <Modal visible={showEditProfileModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Modifier mon profil</Text>
              <View style={styles.imageSelectorRow}>
                <TouchableOpacity style={styles.avatarPicker} onPress={() => pickImage('gallery', 'editProfile')}>
                  <Image source={{ uri: editProfile.avatarUri || getImageUrl(profile?.avatar_url) || 'https://via.placeholder.com/100' }} style={styles.avatarPreview} />
                  <View style={styles.avatarOverlay}><Ionicons name="camera" size={20} color="#fff" /></View>
                </TouchableOpacity>
                <View style={{flex: 1, gap: 10}}>
                  <TouchableOpacity style={styles.smallImageBtn} onPress={() => pickImage('gallery', 'editProfile')}>
                    <Text style={styles.smallImageBtnText}>Galerie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallImageBtn} onPress={() => pickImage('camera', 'editProfile')}>
                    <Text style={styles.smallImageBtnText}>Appareil Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput style={styles.modalInput} placeholder="Nom Complet" placeholderTextColor="#666" value={editProfile.full_name} onChangeText={t => setEditProfile({...editProfile, full_name: t})} />
              <TextInput style={styles.modalInput} placeholder="Profession" placeholderTextColor="#666" value={editProfile.profession} onChangeText={t => setEditProfile({...editProfile, profession: t})} />
              <TextInput style={styles.modalInput} placeholder="Localisation" placeholderTextColor="#666" value={editProfile.location} onChangeText={t => setEditProfile({...editProfile, location: t})} />
              <TextInput style={styles.modalInput} placeholder="Âge" keyboardType="numeric" placeholderTextColor="#666" value={editProfile.age} onChangeText={t => setEditProfile({...editProfile, age: t})} />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditProfileModal(false)}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity style={styles.addButtonModal} onPress={handleUpdateProfile} disabled={uploadingImage}>
                  {uploadingImage ? <ActivityIndicator color="#fff" /> : <Text style={styles.addText}>Enregistrer</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 50 },
  profileCard: { backgroundColor: "#111", borderRadius: 25, padding: 25, alignItems: "center", marginHorizontal: 20, marginTop: 10, borderWidth: 1, borderColor: "#222" },
  profileMenuButton: { position: "absolute", top: 20, right: 20 },
  menuText: { color: "#fff", fontSize: 24 },
  adminPanelButton: { position: "absolute", top: 20, left: 20, alignItems: "center" },
  adminPanelIcon: { color: "#8916CB", fontSize: 24 },
  adminPanelText: { color: "#8916CB", fontSize: 10, fontWeight: "700" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 2, borderColor: "#8916CB" },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  info: { color: "#888", fontSize: 14, marginTop: 4 },
  followers: { color: "#666", fontSize: 11, fontWeight: "800", marginTop: 15, letterSpacing: 1 },
  roleBadge: { backgroundColor: "#8916CB", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 15 },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  tabs: { flexDirection: "row", justifyContent: "center", marginVertical: 20, borderBottomWidth: 1, borderBottomColor: "#222" },
  tabText: { color: "#666", fontSize: 13, fontWeight: "700", paddingBottom: 10, marginHorizontal: 20 },
  activeTabText: { color: "#fff", borderBottomWidth: 2, borderBottomColor: "#fff" },
  carsListContent: { paddingHorizontal: 20, paddingBottom: 100 },
  carCard: { backgroundColor: "#111", borderRadius: 18, marginBottom: 15, flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#222" },
  carImage: { width: 80, height: 80, borderRadius: 12 },
  carInfoContainer: { flex: 1, marginLeft: 15 },
  carTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  carDetails: { color: "#666", fontSize: 13, marginTop: 4 },
  carCardMenuButton: { padding: 10 },
  carCardMenuText: { color: "#888", fontSize: 18 },
  fab: { position: "absolute", bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: "#8916CB", justifyContent: "center", alignItems: "center", elevation: 5, zIndex: 1000 },
  fabIcon: { color: "#fff", fontSize: 32, fontWeight: "300" },
  emptyText: { color: "#444", textAlign: "center", marginTop: 50 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center" },
  modalContent: { backgroundColor: "#111", marginHorizontal: 20, borderRadius: 25, padding: 25, borderWidth: 1, borderColor: "#333" },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  modalInput: { backgroundColor: "#000", borderBottomWidth: 1, borderBottomColor: "#333", color: "#fff", padding: 12, marginBottom: 15 },
  imageSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  avatarPicker: { position: 'relative' },
  avatarPreview: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#222' },
  avatarOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#8916CB', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  smallImageBtn: { backgroundColor: '#222', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
  smallImageBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  imageBtnLarge: { flex: 1, backgroundColor: '#222', padding: 15, borderRadius: 12, alignItems: 'center', gap: 8 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancelButton: { flex: 1, alignItems: "center", padding: 15 },
  addButtonModal: { flex: 1, backgroundColor: "#8916CB", borderRadius: 15, alignItems: "center", padding: 15 },
  cancelText: { color: "#666", fontWeight: "700" },
  addText: { color: "#fff", fontWeight: "700" },
});
