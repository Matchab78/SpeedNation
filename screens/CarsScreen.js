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
  
  // États pour les followers
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersType, setFollowersType] = useState("followers"); // "followers" or "following"
  
  const [newCar, setNewCar] = useState({
    name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null,
  });
  const [editCar, setEditCar] = useState({
    name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null,
  });
  const [editProfile, setEditProfile] = useState({
    full_name: "", profession: "", location: "", age: "", avatarUri: null, showAdminRole: true,
  });

  const openFollowersModal = async (type) => {
    if (!user) return;
    setFollowersType(type);
    setFollowersLoading(true);
    setShowFollowersModal(true);
    
    try {
      const { profilesApi } = require("../services/apiService");
      const res = type === "followers" 
        ? await profilesApi.getFollowers(user.id)
        : await profilesApi.getFollowing(user.id);
      
      if (res.data) setFollowersList(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setFollowersLoading(false);
    }
  };


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

  const handleUpdateCar = async () => {
    if (!editCar.name.trim()) return Alert.alert("Erreur", "Nom requis");
    setUploadingImage(true);
    try {
      let imageUrl = editCar.image_url || null;
      if (editCar.imageUri) {
        const { url, error } = await storageService.uploadCarImage(`edit-${editingCarId}-${Date.now()}`, editCar.imageUri);
        if (error) throw error;
        imageUrl = url;
      }
      
      await carService.updateCar(editingCarId, user.id, { 
        ...editCar, 
        image_url: imageUrl,
        price_purchased: parseFloat(editCar.price_purchased || 0),
        power_hp: parseInt(editCar.power_hp || 0),
        year: parseInt(editCar.year || 0)
      });
      
      setShowEditCarModal(false);
      loadCars();
      Alert.alert("Succès", "Voiture mise à jour !");
    } catch (e) { 
      console.error(e);
      Alert.alert("Erreur", "Échec de la mise à jour"); 
    } finally { 
      setUploadingImage(false); 
    }
  };

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const renderCarCard = ({ item }) => (
    <View style={styles.carCard}>
      <Image source={{ uri: getImageUrl(item.image_url) || 'https://via.placeholder.com/150' }} style={styles.carImage} />
      <View style={styles.carInfoContainer}>
        <Text style={styles.carTitle}>{item.name}</Text>
        <Text style={styles.carDetails}>{item.price_purchased}€ • {item.power_hp} Ch</Text>
      </View>
      <TouchableOpacity 
        style={styles.carCardMenuButton} 
        onPress={() => {
          setSelectedCar(item);
          setShowActionMenu(true);
        }}
      >
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
        
        <View style={styles.followRow}>
          <TouchableOpacity onPress={() => openFollowersModal("followers")}>
            <Text style={styles.followers}>{profile?.followers_count || 0} FOLLOWERS</Text>
          </TouchableOpacity>
          <View style={styles.followSeparator} />
          <TouchableOpacity onPress={() => openFollowersModal("following")}>
            <Text style={styles.followers}>{profile?.following_count || 0} SUIVI</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && profile?.show_admin_role !== false && (
          <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>Administrateur</Text></View>
        )}
      </View>

      {/* --- MODALE ACTIONS VOITURE (Custom Menu) --- */}
      <Modal visible={showActionMenu} animationType="fade" transparent onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenuContent}>
            <Text style={styles.actionMenuTitle}>{selectedCar?.name}</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setShowActionMenu(false);
                setEditingCarId(selectedCar.id);
                setEditCar({
                  ...selectedCar, 
                  year: selectedCar.year?.toString() || "", 
                  price_purchased: selectedCar.price_purchased?.toString() || "", 
                  power_hp: selectedCar.power_hp?.toString() || "", 
                  imageUri: null
                });
                setShowEditCarModal(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Modifier la voiture</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { borderBottomWidth: 0 }]}
              onPress={() => {
                setShowActionMenu(false);
                Alert.alert(
                  "Supprimer",
                  "Voulez-vous vraiment supprimer cette voiture ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    { text: "Supprimer", style: "destructive", onPress: async () => {
                        await carService.deleteCar(selectedCar.id, user.id);
                        loadCars();
                    }}
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#f97373" />
              <Text style={[styles.actionButtonText, { color: "#f97373" }]}>Supprimer définitivement</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCancelButton} onPress={() => setShowActionMenu(false)}>
              <Text style={styles.actionCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODALE FOLLOWERS/FOLLOWING --- */}
      <Modal visible={showFollowersModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.followModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {followersType === "followers" ? "Abonnés" : "Abonnements"}
              </Text>
              <TouchableOpacity onPress={() => setShowFollowersModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {followersLoading ? (
              <ActivityIndicator color="#8916CB" style={{ margin: 20 }} />
            ) : (
              <FlatList
                data={followersList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.followItem}
                    onPress={() => {
                      setShowFollowersModal(false);
                      navigation.navigate("UserProfile", { userId: item.id });
                    }}
                  >
                    <Image 
                      source={{ uri: item.avatar_url ? getImageUrl(item.avatar_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name)}&background=8916CB&color=fff` }} 
                      style={styles.followAvatar} 
                    />
                    <View>
                      <Text style={styles.followName}>{item.full_name}</Text>
                      <Text style={styles.followProfession}>{item.profession || "Membre"}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* --- TABS + BOUTON AJOUTER --- */}
      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => setActiveTab("cars")}>
          <Text style={[styles.tabText, activeTab === "cars" && styles.activeTabText]}>MES VOITURES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addCarHeaderBtn}
          onPress={() => {
            setNewCar({ name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null });
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addCarHeaderBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* --- LISTE --- */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={renderCarCard}
          contentContainerStyle={styles.carsListContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune voiture ajoutée</Text>}
        />
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

      {/* --- MODAL MODIFIER VOITURE --- */}
      <Modal visible={showEditCarModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditCarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Modifier la voiture</Text>
              <TextInput style={styles.modalInput} placeholder="Nom de la voiture *" placeholderTextColor="#666" value={editCar.name} onChangeText={t => setEditCar({...editCar, name: t})} />
              <TextInput style={styles.modalInput} placeholder="Marque" placeholderTextColor="#666" value={editCar.brand} onChangeText={t => setEditCar({...editCar, brand: t})} />
              <TextInput style={styles.modalInput} placeholder="Modèle" placeholderTextColor="#666" value={editCar.model} onChangeText={t => setEditCar({...editCar, model: t})} />
              <TextInput style={styles.modalInput} placeholder="Année" keyboardType="numeric" placeholderTextColor="#666" value={editCar.year} onChangeText={t => setEditCar({...editCar, year: t})} />
              <TextInput style={styles.modalInput} placeholder="Prix d'achat (€)" keyboardType="numeric" placeholderTextColor="#666" value={editCar.price_purchased} onChangeText={t => setEditCar({...editCar, price_purchased: t})} />
              <TextInput style={styles.modalInput} placeholder="Puissance (ch)" keyboardType="numeric" placeholderTextColor="#666" value={editCar.power_hp} onChangeText={t => setEditCar({...editCar, power_hp: t})} />
              
              <View style={styles.imageSelectorRow}>
                <TouchableOpacity style={styles.avatarPicker} onPress={() => pickImage('gallery', 'editCar')}>
                  <Image source={{ uri: editCar.imageUri || getImageUrl(editCar.image_url) || 'https://via.placeholder.com/150' }} style={styles.avatarPreview} />
                  <View style={styles.avatarOverlay}><Ionicons name="camera" size={20} color="#fff" /></View>
                </TouchableOpacity>
                <View style={{flex: 1, gap: 10}}>
                  <TouchableOpacity style={styles.smallImageBtn} onPress={() => pickImage('gallery', 'editCar')}>
                    <Text style={styles.smallImageBtnText}>Galerie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallImageBtn} onPress={() => pickImage('camera', 'editCar')}>
                    <Text style={styles.smallImageBtnText}>Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditCarModal(false)}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButtonModal} onPress={handleUpdateCar} disabled={uploadingImage}>
                  {uploadingImage ? <ActivityIndicator color="#fff" /> : <Text style={styles.addText}>Enregistrer</Text>}
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

const COLORS = {
  background: "#0B0813",
  surface: "#16121F",
  surfaceElevated: "#1E1A2B",
  border: "rgba(80, 70, 110, 0.4)",
  foreground: "#FAFAFA",
  mutedForeground: "#9B95AE",
  primary: "#8916CB",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  profileCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 28, 
    padding: 25, 
    alignItems: "center", 
    marginHorizontal: 20, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  profileMenuButton: { position: "absolute", top: 20, right: 20, padding: 5 },
  menuText: { color: COLORS.foreground, fontSize: 24 },
  adminPanelButton: { position: "absolute", top: 20, left: 20, alignItems: "center" },
  adminPanelIcon: { color: COLORS.primary, fontSize: 24 },
  adminPanelText: { color: COLORS.primary, fontSize: 10, fontWeight: "700" },
  avatar: { width: 100, height: 100, borderRadius: 30, marginBottom: 15, borderWidth: 2, borderColor: COLORS.primary },
  name: { color: COLORS.foreground, fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  info: { color: COLORS.mutedForeground, fontSize: 14, marginTop: 4 },
  followers: { color: COLORS.foreground, fontSize: 12, fontWeight: "bold", letterSpacing: 1 },
  followRow: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 20 },
  followSeparator: { width: 1, height: 12, backgroundColor: COLORS.border },
  followModalContainer: { flex: 1, backgroundColor: COLORS.background, marginTop: 60, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  followItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  followAvatar: { width: 48, height: 48, borderRadius: 16, marginRight: 15, borderWidth: 1, borderColor: COLORS.border },
  followName: { color: COLORS.foreground, fontSize: 16, fontWeight: "600" },
  followProfession: { color: COLORS.mutedForeground, fontSize: 12 },
  roleBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 15 },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  tabsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 25, paddingBottom: 10 },
  tabText: { color: COLORS.mutedForeground, fontSize: 13, fontWeight: "700", paddingBottom: 10, letterSpacing: 1 },
  activeTabText: { color: COLORS.foreground, borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  addCarHeaderBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999 },
  addCarHeaderBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  carsListContent: { paddingHorizontal: 20, paddingBottom: 120 },
  carCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 22, 
    marginBottom: 15, 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  carImage: { width: 85, height: 85, borderRadius: 16 },
  carInfoContainer: { flex: 1, marginLeft: 15 },
  carTitle: { color: COLORS.foreground, fontSize: 17, fontWeight: "700" },
  carDetails: { color: COLORS.mutedForeground, fontSize: 13, marginTop: 4 },
  carCardMenuButton: { padding: 10 },
  carCardMenuText: { color: COLORS.mutedForeground, fontSize: 18 },
  emptyText: { color: COLORS.mutedForeground, textAlign: "center", marginTop: 50 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center" },
  modalContent: { backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 28, padding: 25, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.foreground, fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 15, color: COLORS.foreground, padding: 14, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  imageSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  avatarPicker: { position: 'relative' },
  avatarPreview: { width: 90, height: 90, borderRadius: 25, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border },
  avatarOverlay: { position: 'absolute', bottom: -5, right: -5, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.surface },
  smallImageBtn: { backgroundColor: COLORS.surfaceElevated, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  smallImageBtnText: { color: COLORS.foreground, fontSize: 13, fontWeight: "600" },
  imageBtnLarge: { flex: 1, backgroundColor: COLORS.surfaceElevated, padding: 18, borderRadius: 18, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 25, gap: 15 },
  cancelButton: { flex: 1, alignItems: "center", padding: 15 },
  addButtonModal: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 999, alignItems: "center", padding: 15 },
  cancelText: { color: COLORS.mutedForeground, fontWeight: "700" },
  addText: { color: "#fff", fontWeight: "700" },

  /* --- ACTION MENU STYLES --- */
  actionMenuContent: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  actionMenuTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 15,
  },
  actionButtonText: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  actionCancelButton: {
    marginTop: 5,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
  },
  actionCancelText: {
    color: COLORS.mutedForeground,
    fontSize: 15,
    fontWeight: "700",
  },
});
