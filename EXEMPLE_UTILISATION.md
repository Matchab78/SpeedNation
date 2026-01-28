# Exemples d'utilisation des services Supabase

## 🔐 Authentification

### Connexion
```javascript
import { authService } from './services/authService';

const handleLogin = async (email, password) => {
  const { data, error } = await authService.signIn(email, password);
  
  if (error) {
    Alert.alert('Erreur', error.message);
    return;
  }
  
  // Récupérer le profil complet
  const { data: profile } = await authService.getUserProfile(data.user.id);
  console.log('Profil:', profile);
};
```

### Inscription
```javascript
const handleSignUp = async (email, password, userData) => {
  const { data, error } = await authService.signUp(email, password, {
    full_name: userData.fullName,
    profession: userData.profession,
    location: userData.location,
    age: userData.age,
  });
  
  if (error) {
    Alert.alert('Erreur', error.message);
    return;
  }
  
  console.log('Utilisateur créé:', data);
};
```

## 🚗 Gestion des voitures

### Récupérer les voitures d'un utilisateur
```javascript
import { carService } from './services/carService';

const [cars, setCars] = useState([]);

useEffect(() => {
  const loadCars = async () => {
    const { data, error } = await carService.getUserCars(userId);
    if (!error) {
      setCars(data);
    }
  };
  loadCars();
}, [userId]);
```

### Ajouter une voiture
```javascript
const handleAddCar = async () => {
  const newCar = {
    name: "Porsche 911 GT3 • 2023",
    brand: "Porsche",
    model: "911 GT3",
    year: 2023,
    price_purchased: 355000,
    power_hp: 329,
    image_url: "https://example.com/car.jpg", // Ou URL Supabase Storage
  };
  
  const { data, error } = await carService.addCar(userId, newCar);
  
  if (error) {
    Alert.alert('Erreur', 'Impossible d\'ajouter la voiture');
    return;
  }
  
  console.log('Voiture ajoutée:', data);
  // Recharger la liste
};
```

### Mettre à jour une voiture
```javascript
const handleUpdateCar = async (carId) => {
  const updates = {
    price_purchased: 360000,
    power_hp: 350,
  };
  
  const { data, error } = await carService.updateCar(carId, userId, updates);
  
  if (error) {
    Alert.alert('Erreur', 'Impossible de mettre à jour');
    return;
  }
  
  console.log('Voiture mise à jour:', data);
};
```

### Supprimer une voiture
```javascript
const handleDeleteCar = async (carId) => {
  const { error } = await carService.deleteCar(carId, userId);
  
  if (error) {
    Alert.alert('Erreur', 'Impossible de supprimer');
    return;
  }
  
  // Recharger la liste
};
```

## 📅 Gestion des événements

### Récupérer tous les événements
```javascript
import { eventService } from './services/eventService';

const [events, setEvents] = useState([]);

useEffect(() => {
  const loadEvents = async () => {
    const { data, error } = await eventService.getAllEvents();
    if (!error) {
      setEvents(data);
    }
  };
  loadEvents();
}, []);
```

### Créer un événement
```javascript
const handleCreateEvent = async () => {
  const newEvent = {
    title: "Rassemblement Supercars",
    description: "Rassemblement de supercars à Paris",
    event_date: "2025-04-12", // Format YYYY-MM-DD
    event_time: "14:00:00", // Format HH:MM:SS
    location: "Paris - La Défense",
    image_url: "https://example.com/event.jpg",
  };
  
  const { data, error } = await eventService.createEvent(userId, newEvent);
  
  if (error) {
    Alert.alert('Erreur', 'Impossible de créer l\'événement');
    return;
  }
  
  console.log('Événement créé:', data);
};
```

### Rejoindre un événement
```javascript
const handleJoinEvent = async (eventId) => {
  const { data, error } = await eventService.joinEvent(userId, eventId);
  
  if (error) {
    Alert.alert('Erreur', 'Impossible de rejoindre l\'événement');
    return;
  }
  
  console.log('Événement rejoint:', data);
};
```

## 📸 Upload d'images vers Supabase Storage

### Configuration du storage
```javascript
import { supabase } from './config/supabase';

// Upload d'une image de voiture
const uploadCarImage = async (imageUri, carId) => {
  try {
    // Convertir l'image en blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Upload vers Supabase Storage
    const fileName = `car-${carId}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
      });
    
    if (error) throw error;
    
    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Erreur upload:', error);
    return null;
  }
};
```

## 🔄 Exemple complet : Écran de profil avec voitures

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { carService } from '../services/carService';
import { authService } from '../services/authService';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Récupérer l'utilisateur actuel
    const { user: currentUser } = await authService.getCurrentUser();
    if (!currentUser) return;

    // Récupérer le profil
    const { data: profile } = await authService.getUserProfile(currentUser.id);
    setUser(profile);

    // Récupérer les voitures
    const { data: userCars } = await carService.getUserCars(currentUser.id);
    setCars(userCars || []);
    
    setLoading(false);
  };

  const handleAddCar = async () => {
    // Votre logique d'ajout de voiture
    const newCar = {
      name: "Nouvelle voiture",
      brand: "Marque",
      model: "Modèle",
      year: 2024,
      price_purchased: 100000,
      power_hp: 200,
      image_url: null,
    };

    const { error } = await carService.addCar(user.id, newCar);
    if (!error) {
      loadData(); // Recharger
    }
  };

  if (loading) {
    return <Text>Chargement...</Text>;
  }

  return (
    <View>
      <Text>{user?.full_name}</Text>
      <Text>{user?.location}</Text>
      
      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.price_purchased}€ • {item.power_hp} Ch</Text>
          </View>
        )}
      />
      
      <TouchableOpacity onPress={handleAddCar}>
        <Text>Ajouter une voiture</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## ⚠️ Notes importantes

1. **Gestion des erreurs** : Toujours vérifier `error` dans les réponses
2. **Chargement** : Utiliser des états de chargement pour améliorer l'UX
3. **Rechargement** : Après ajout/modification/suppression, recharger les données
4. **Images** : Utiliser Supabase Storage ou un service externe (Cloudinary, etc.)
5. **Authentification** : Vérifier que l'utilisateur est connecté avant les opérations
