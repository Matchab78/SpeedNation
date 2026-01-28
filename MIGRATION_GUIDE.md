# Guide de migration vers auth.users

## 🎯 Changements principaux

Le projet utilise maintenant **auth.users** de Supabase pour l'authentification au lieu d'une table `users` personnalisée.

### Avant
- Table `users` avec email, password_hash, etc.
- Duplication des données d'authentification

### Après
- **auth.users** (géré par Supabase) : email, password, etc.
- Table **profiles** : données supplémentaires (full_name, profession, location, age, avatar_url, followers_count, role)

## 📋 Étapes de migration

### Pour une nouvelle base de données

1. Exécutez simplement `supabase/schema.sql` dans Supabase SQL Editor
2. Le trigger `handle_new_user()` créera automatiquement un profil lors de l'inscription

### Pour une base existante

1. **Sauvegardez vos données** avant toute migration !

2. Exécutez le script de migration :
   ```sql
   -- Dans Supabase SQL Editor
   -- Copiez-collez le contenu de supabase/migration_to_auth_users.sql
   ```

3. Vérifiez que les données ont été migrées :
   ```sql
   SELECT COUNT(*) FROM profiles;
   ```

4. (Optionnel) Supprimez l'ancienne table `users` après vérification :
   ```sql
   -- ATTENTION : Ne faites cela QUE si vous êtes sûr que tout fonctionne
   DROP TABLE IF EXISTS users CASCADE;
   ```

## 🔄 Changements dans le code

### Services mis à jour

Tous les services ont été mis à jour pour utiliser `profiles` au lieu de `users` :

- ✅ `authService.js` - Utilise `profiles` pour les données de profil
- ✅ `carService.js` - Jointures avec `profiles` au lieu de `users`
- ✅ `eventService.js` - Vérifie le rôle dans `profiles`
- ✅ `adminService.js` - Gère les rôles dans `profiles`

### Exemple d'utilisation

```javascript
import { authService } from './services/authService';

// Inscription (le profil est créé automatiquement)
const { data, error } = await authService.signUp(email, password, {
  full_name: "John Doe",
  profession: "Développeur",
  location: "Paris",
  age: 25
});

// Récupérer le profil
const { data: profile } = await authService.getUserProfile(userId);
// profile contient : full_name, profession, location, age, avatar_url, followers_count, role

// Vérifier si admin
const { isAdmin } = await authService.isAdmin(userId);
```

## 🔐 Authentification

L'authentification utilise maintenant directement Supabase Auth :

```javascript
// Connexion
const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// L'utilisateur est dans data.user
// Le profil est dans la table profiles avec le même ID
```

## 📊 Structure des données

### auth.users (géré par Supabase)
- `id` (UUID)
- `email` (TEXT)
- `encrypted_password` (TEXT)
- `created_at`, `updated_at`
- ... (autres champs gérés par Supabase)

### profiles (table publique)
- `id` (UUID) - Référence auth.users(id)
- `full_name` (TEXT)
- `profession` (TEXT)
- `location` (TEXT)
- `age` (INTEGER)
- `avatar_url` (TEXT)
- `followers_count` (INTEGER)
- `role` (TEXT) - 'user' ou 'admin'
- `created_at`, `updated_at`

## ⚠️ Points importants

1. **Le profil est créé automatiquement** lors de l'inscription via le trigger `handle_new_user()`

2. **Les références dans les autres tables** pointent maintenant vers `auth.users(id)` :
   - `cars.user_id` → `auth.users(id)`
   - `events.creator_id` → `auth.users(id)`
   - `event_participants.user_id` → `auth.users(id)`
   - `car_favorites.user_id` → `auth.users(id)`

3. **Pour récupérer l'email**, utilisez `auth.users` ou combinez avec le profil :
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   const email = user.email;
   ```

4. **Pour promouvoir un utilisateur en admin** :
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = 'user-id-here';
   ```

## 🐛 Dépannage

### Le profil n'est pas créé automatiquement

Vérifiez que le trigger existe :
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Si le trigger n'existe pas, recréez-le :
```sql
-- Voir le schéma pour la définition complète du trigger
```

### Erreur "relation profiles does not exist"

Exécutez d'abord la création de la table :
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... voir schema.sql pour la définition complète
);
```
