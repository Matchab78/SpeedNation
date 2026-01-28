# Configuration Supabase pour SpeedNation

## 📋 Étapes d'installation

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Notez votre **URL du projet** et votre **clé API anonyme (anon key)**

### 2. Configurer les variables d'environnement

Ouvrez le fichier `config/supabase.js` et remplacez :
- `YOUR_SUPABASE_URL` par votre URL Supabase
- `YOUR_SUPABASE_ANON_KEY` par votre clé API anonyme

Vous pouvez trouver ces valeurs dans votre projet Supabase : **Settings > API**

### 3. Créer les tables dans Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Copiez tout le contenu du fichier `supabase/schema.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run** pour exécuter le script

Cela créera toutes les tables nécessaires :
- `profiles` - Profils utilisateurs (données supplémentaires)
- `cars` - Flotte de voitures
- `events` - Événements
- `event_participants` - Participants aux événements
- `car_favorites` - Voitures favorites

**Note importante** : L'authentification utilise `auth.users` de Supabase (géré automatiquement). La table `profiles` stocke uniquement les données supplémentaires.

**Si vous avez déjà une base de données existante**, utilisez le script de migration :
1. Exécutez le fichier `supabase/migration_to_auth_users.sql` dans SQL Editor
2. Consultez `MIGRATION_GUIDE.md` pour plus de détails

### 4. Configurer l'authentification Supabase

1. Dans Supabase, allez dans **Authentication > Settings**
2. Activez **Email** comme méthode d'authentification
3. (Optionnel) Configurez les emails de confirmation si nécessaire

### 5. Stockage des images (optionnel mais recommandé)

Pour stocker les photos de voitures et de profil :

1. Dans Supabase, allez dans **Storage**
2. Créez un bucket nommé `car-images` (publique)
3. Créez un bucket nommé `avatars` (publique)
4. Créez un bucket nommé `event-images` (publique)

## 📊 Structure des tables

### `auth.users` (géré par Supabase)
- `id` (UUID) - Identifiant unique
- `email` (TEXT) - Email de l'utilisateur
- `encrypted_password` (TEXT) - Mot de passe chiffré
- `created_at`, `updated_at` - Timestamps
- ... (autres champs gérés automatiquement par Supabase)

### Table `profiles`
- `id` (UUID) - Référence à `auth.users(id)`
- `full_name` (TEXT) - Nom complet
- `profession` (TEXT) - Profession
- `location` (TEXT) - Localisation
- `age` (INTEGER) - Âge
- `avatar_url` (TEXT) - URL de la photo de profil
- `followers_count` (INTEGER) - Nombre de followers
- `role` (TEXT) - Rôle de l'utilisateur : `'user'` (par défaut) ou `'admin'`
- `created_at`, `updated_at` - Timestamps

**Note** : Le profil est créé automatiquement lors de l'inscription via un trigger.

### Table `cars`
- `id` (UUID) - Identifiant unique
- `user_id` (UUID) - Référence à `auth.users(id)`
- `name` (TEXT) - Nom complet (ex: "Porsche 911 GT3 • 2023")
- `brand` (TEXT) - Marque
- `model` (TEXT) - Modèle
- `year` (INTEGER) - Année
- `price_purchased` (DECIMAL) - Prix d'achat en euros
- `power_hp` (INTEGER) - Puissance en chevaux
- `image_url` (TEXT) - URL de la photo
- `created_at`, `updated_at` - Timestamps

### Table `events`
- `id` (UUID) - Identifiant unique
- `creator_id` (UUID) - Référence à `auth.users(id)`
- `title` (TEXT) - Titre de l'événement
- `description` (TEXT) - Description
- `event_date` (DATE) - Date de l'événement
- `event_time` (TIME) - Heure de l'événement
- `location` (TEXT) - Lieu
- `image_url` (TEXT) - URL de l'image
- `created_at`, `updated_at` - Timestamps

## 🔐 Sécurité (RLS)

Le schéma inclut des politiques de sécurité Row Level Security (RLS) :
- Les utilisateurs peuvent voir tous les profils
- Les utilisateurs ne peuvent modifier que leur propre profil
- Les utilisateurs peuvent créer/modifier/supprimer leurs propres voitures
- **Seuls les administrateurs peuvent créer des événements** ⚠️
- Les utilisateurs peuvent modifier/supprimer leurs propres événements
- Les utilisateurs peuvent gérer leurs propres favoris

## 👑 Système de rôles

### Rôles disponibles
- `user` : Utilisateur standard (par défaut)
- `admin` : Administrateur (peut créer des événements)

### Promouvoir un utilisateur en administrateur

**Option 1 : Via SQL (recommandé pour la première fois)**
```sql
-- Dans Supabase SQL Editor
-- D'abord, trouvez l'ID de l'utilisateur
SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- Puis mettez à jour le profil
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-id-here';
```

**Option 2 : Via le service adminService**
```javascript
import { adminService } from './services/adminService';

// ⚠️ Cette fonction nécessite des privilèges élevés
const { data, error } = await adminService.promoteToAdmin(userId);
```

### Vérifier si un utilisateur est admin
```javascript
import { authService } from './services/authService';

const { isAdmin, error } = await authService.isAdmin(userId);
if (isAdmin) {
  console.log('Cet utilisateur est administrateur');
}
```

## 🚀 Utilisation dans le code

### Exemple : Connexion
```javascript
import { authService } from './services/authService';

const { data, error } = await authService.signIn(email, password);
if (error) {
  console.error('Erreur de connexion:', error.message);
} else {
  console.log('Connecté!', data.user);
}
```

### Exemple : Ajouter une voiture
```javascript
import { carService } from './services/carService';

const { data, error } = await carService.addCar(userId, {
  name: "Porsche 911 GT3 • 2023",
  brand: "Porsche",
  model: "911 GT3",
  year: 2023,
  price_purchased: 355000,
  power_hp: 329,
  image_url: "https://..."
});
```

### Exemple : Récupérer les événements
```javascript
import { eventService } from './services/eventService';

const { data, error } = await eventService.getAllEvents();
if (!error) {
  console.log('Événements:', data);
}
```

### Exemple : Créer un événement (admin uniquement)
```javascript
import { eventService } from './services/eventService';
import { authService } from './services/authService';

// Vérifier d'abord si l'utilisateur est admin
const { isAdmin } = await authService.isAdmin(userId);

if (!isAdmin) {
  Alert.alert('Erreur', 'Seuls les administrateurs peuvent créer des événements');
  return;
}

// Créer l'événement
const { data, error } = await eventService.createEvent(userId, {
  title: "Rassemblement Supercars",
  event_date: "2025-04-12",
  location: "Paris - La Défense",
});

if (error) {
  console.error('Erreur:', error.message);
}
```

## 📝 Notes importantes

- Assurez-vous que Supabase Auth est bien configuré avant d'utiliser les services
- Les images peuvent être stockées dans Supabase Storage ou un autre service (Cloudinary, etc.)
- Les politiques RLS peuvent être ajustées selon vos besoins de sécurité
- N'oubliez pas de mettre à jour les timestamps `updated_at` lors des modifications
