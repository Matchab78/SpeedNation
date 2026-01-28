# Exemples d'utilisation - Système d'administration

## 🔐 Vérifier les permissions avant de créer un événement

### Dans votre composant EventsScreen

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { eventService } from '../services/eventService';
import { authService } from '../services/authService';

export default function EventsScreen({ navigation }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    // Récupérer l'utilisateur actuel
    const { user } = await authService.getCurrentUser();
    if (!user) return;

    setUserId(user.id);

    // Vérifier si c'est un admin
    const { isAdmin: adminStatus } = await authService.isAdmin(user.id);
    setIsAdmin(adminStatus);
  };

  const handleCreateEvent = async () => {
    // Vérification côté client (optionnel, la vraie sécurité est côté serveur)
    if (!isAdmin) {
      Alert.alert(
        'Accès refusé',
        'Seuls les administrateurs peuvent créer des événements'
      );
      return;
    }

    // Créer l'événement
    const newEvent = {
      title: "Nouvel événement",
      description: "Description de l'événement",
      event_date: "2025-04-12",
      event_time: "14:00:00",
      location: "Paris",
    };

    const { data, error } = await eventService.createEvent(userId, newEvent);

    if (error) {
      if (error.code === 'PERMISSION_DENIED') {
        Alert.alert('Erreur', 'Vous n\'avez pas les permissions nécessaires');
      } else {
        Alert.alert('Erreur', error.message);
      }
      return;
    }

    Alert.alert('Succès', 'Événement créé avec succès');
    // Recharger la liste des événements
  };

  return (
    <View>
      {/* Afficher le bouton "+" seulement si admin */}
      {isAdmin && (
        <TouchableOpacity onPress={handleCreateEvent}>
          <Text>+</Text>
        </TouchableOpacity>
      )}

      {/* Liste des événements */}
    </View>
  );
}
```

## 👑 Gestion des administrateurs

### Promouvoir un utilisateur en admin

```javascript
import { adminService } from './services/adminService';

const promoteUser = async (userId) => {
  // ⚠️ Cette fonction doit être utilisée avec précaution
  // Idéalement, créez une interface admin sécurisée
  
  const { data, error } = await adminService.promoteToAdmin(userId);
  
  if (error) {
    Alert.alert('Erreur', 'Impossible de promouvoir l\'utilisateur');
    return;
  }
  
  Alert.alert('Succès', 'Utilisateur promu administrateur');
};
```

### Rétrograder un admin

```javascript
const demoteAdmin = async (userId) => {
  const { data, error } = await adminService.demoteFromAdmin(userId);
  
  if (error) {
    Alert.alert('Erreur', 'Impossible de rétrograder l\'administrateur');
    return;
  }
  
  Alert.alert('Succès', 'Administrateur rétrogradé');
};
```

### Lister tous les administrateurs

```javascript
const loadAdmins = async () => {
  const { data, error } = await adminService.getAllAdmins();
  
  if (error) {
    console.error('Erreur:', error);
    return;
  }
  
  console.log('Administrateurs:', data);
};
```

## 🔒 Sécurité côté serveur

**Important** : La vérification du rôle se fait automatiquement côté serveur grâce aux politiques RLS (Row Level Security) de Supabase. Même si un utilisateur essaie de contourner la vérification côté client, la base de données refusera la création d'événement si l'utilisateur n'est pas admin.

### Politique RLS en place

```sql
-- Seuls les administrateurs peuvent créer des événements
CREATE POLICY "Only admins can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

Cette politique garantit que :
1. L'utilisateur connecté est bien le créateur (`auth.uid() = creator_id`)
2. L'utilisateur a le rôle `'admin'` dans la table `users`

## 📝 Créer le premier administrateur

Après avoir créé votre compte utilisateur, promouvez-le en admin via SQL :

```sql
-- Dans Supabase SQL Editor
UPDATE users 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';
```

Ou utilisez la fonction helper :

```sql
SELECT promote_to_admin('user-uuid-here');
```

## ⚠️ Bonnes pratiques

1. **Ne jamais exposer les fonctions adminService dans l'interface utilisateur standard**
2. **Créer une interface admin sécurisée** avec authentification renforcée
3. **Logger toutes les actions administratives** pour audit
4. **Limiter le nombre d'administrateurs** au strict nécessaire
5. **Vérifier les permissions côté client ET serveur** (défense en profondeur)
