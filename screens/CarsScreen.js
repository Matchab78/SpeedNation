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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../utils/authContext";
import { carService } from "../services/carService";
import { storageService } from "../services/storageService";

export default function CarsScreen({ navigation }) {
  const { user, profile, refreshUser, isAdmin } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [editingCarId, setEditingCarId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newCar, setNewCar] = useState({
    name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null,
  });
  const [editCar, setEditCar] = useState({
    name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null,
  });

  useEffect(() => {
    if (user) loadCars();
    else setLoading(false);
  }, [user]);

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

  const pickImage = async (mode, type = 'new') => {
    try {
      const result = mode === 'gallery' 
        ? await storageService.pickImageFromGallery() 
        : await storageService.takePhoto();

      if (!result.cancelled && result.uri) {
        if (type === 'new') setNewCar({ ...newCar, imageUri: result.uri });
        else setEditCar({ ...editCar, imageUri: result.uri });
      } else if (result.error) {
        Alert.alert("Erreur", "L'accès aux photos est peut-être bloqué par votre navigateur car le site n'est pas en HTTPS.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCar = async () => {
    if (!newCar.name.trim() || !newCar.price_purchased || !newCar.power_hp) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires");
      return;
    }

    setUploadingImage(true);
    try {
      let imageUrl = newCar.image_url.trim() || null;
      if (newCar.imageUri) {
        const { url, error } = await storageService.uploadCarImage(`temp-${user.id}`, newCar.imageUri);
        if (error) throw error;
        imageUrl = url;
      }

      const { error: addError } = await carService.addCar(user.id, {
        ...newCar,
        price_purchased: parseFloat(newCar.price_purchased),
        power_hp: parseInt(newCar.power_hp),
        year: newCar.year ? parseInt(newCar.year) : null,
        image_url: imageUrl
      });

      if (addError) throw addError;

      Alert.alert("Succès", "Voiture ajoutée !");
      setShowAddModal(false);
      setNewCar({ name: "", brand: "", model: "", year: "", price_purchased: "", power_hp: "", image_url: "", imageUri: null });
      loadCars();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter la voiture");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateCar = async () => {
    if (!editingCarId) return;
    setUploadingImage(true);
    try {
      let imageUrl = editCar.image_url.trim() || null;
      if (editCar.imageUri) {
        const { url, error } = await storageService.uploadCarImage(editingCarId, editCar.imageUri);
        if (error) throw error;
        imageUrl = url;
      }

      await carService.updateCar(editingCarId, user.id, {
        ...editCar,
        price_purchased: parseFloat(editCar.price_purchased),
        power_hp: parseInt(editCar.power_hp),
        year: editCar.year ? parseInt(editCar.year) : null,
        image_url: imageUrl
      });

      Alert.alert("Succès", "Voiture modifiée !");
      setShowEditCarModal(false);
      loadCars();
    } catch (error) {
      Alert.alert("Erreur", "Échec de la modification");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteCar = (id) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer cette voiture ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
         await carService.deleteCar(id, user.id);
         loadCars();
      }}
    ]);
  };

  const renderCarCard = ({ item }) => (
    <View style={styles.carCard}>
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/150?text=Pas+de+photo' }} 
        style={styles.carImage} 
      />
      <View style={styles.carInfo}>
        <Text style={styles.carTitle}>{item.name}</Text>
        <Text style={styles.carSub}>{item.brand} {item.model}</Text>
      </View>
      <View style={styles.carActions}>
        <TouchableOpacity onPress={() => {
            setEditingCarId(item.id);
            setEditCar({...item, year: item.year?.toString() || "", price_purchased: item.price_purchased?.toString() || "", power_hp: item.power_hp?.toString() || "", imageUri: null});
            setShowEditCarModal(true);
        }}>
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteCar(item.id)}>
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/60' }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.welcome}>Bienvenue,</Text>
            <Text style={styles.profileName}>{profile?.full_name || user?.email}</Text>
          </View>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate("AdminPanel")}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={renderCarCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucune voiture pour le moment</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal Ajout */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Ajouter une voiture</Text>
              <TextInput style={styles.input} placeholder="Nom (ex: Ma RS3)" placeholderTextColor="#666" value={newCar.name} onChangeText={t => setNewCar({...newCar, name: t})} />
              <TextInput style={styles.input} placeholder="Prix (€)" keyboardType="numeric" placeholderTextColor="#666" value={newCar.price_purchased} onChangeText={t => setNewCar({...newCar, price_purchased: t})} />
              <TextInput style={styles.input} placeholder="Puissance (ch)" keyboardType="numeric" placeholderTextColor="#666" value={newCar.power_hp} onChangeText={t => setNewCar({...newCar, power_hp: t})} />
              
              <View style={styles.imageSelector}>
                <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage('gallery')}>
                  <Ionicons name="images" size={24} color="#fff" />
                  <Text style={styles.imageBtnText}>Galerie</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage('camera')}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.imageBtnText}>Photo</Text>
                </TouchableOpacity>
              </View>

              {newCar.imageUri && <Image source={{ uri: newCar.imageUri }} style={styles.preview} />}

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}><Text style={styles.btnText}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddCar} disabled={uploadingImage}>
                  {uploadingImage ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ajouter</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Edition (Similaire mais abrégé ici) */}
      <Modal visible={showEditCarModal} animationType="slide" transparent={true}>
         {/* ... (Contenu similaire à l'ajout avec handleUpdateCar) */}
         <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Modifier la voiture</Text>
              <TextInput style={styles.input} value={editCar.name} onChangeText={t => setEditCar({...editCar, name: t})} />
              <View style={styles.imageSelector}>
                <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage('gallery', 'edit')}><Ionicons name="images" size={24} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage('camera', 'edit')}><Ionicons name="camera" size={24} color="#fff" /></TouchableOpacity>
              </View>
              {editCar.imageUri && <Image source={{ uri: editCar.imageUri }} style={styles.preview} />}
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditCarModal(false)}><Text style={styles.btnText}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateCar} disabled={uploadingImage}><Text style={styles.btnText}>Enregistrer</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#111' },
  welcome: { color: '#666', fontSize: 12 },
  profileName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  adminBtn: { padding: 10, backgroundColor: '#8916CB', borderRadius: 12 },
  list: { padding: 20 },
  carCard: { backgroundColor: '#111', borderRadius: 16, padding: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  carImage: { width: 70, height: 70, borderRadius: 12 },
  carInfo: { flex: 1 },
  carTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  carSub: { color: '#666', fontSize: 13 },
  carActions: { gap: 15 },
  empty: { color: '#444', textAlign: 'center', marginTop: 50 },
  fab: { position: 'absolute', right: 25, bottom: 25, backgroundColor: '#8916CB', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, minHeight: '60%' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input: { backgroundColor: '#222', borderRadius: 12, padding: 15, color: '#fff', marginBottom: 15 },
  imageSelector: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  imageBtn: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  imageBtnText: { color: '#fff', fontWeight: '600' },
  preview: { width: '100%', height: 150, borderRadius: 12, marginBottom: 15 },
  modalBtns: { flexDirection: 'row', gap: 15, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 2, backgroundColor: '#8916CB', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
