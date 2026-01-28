# ✅ Checklist : Configuration de la connexion

## 📋 Vérifications à faire

### 1. Configuration Supabase ⚠️ IMPORTANT

- [ ] **Créer un projet Supabase** sur [supabase.com](https://supabase.com)
- [ ] **Configurer les credentials** dans `config/supabase.js` :
  ```javascript
  const SUPABASE_URL = 'https://votre-projet.supabase.co';
  const SUPABASE_ANON_KEY = 'votre-clé-anon';
  ```
- [ ] **Exécuter le schéma SQL** : Copiez `supabase/schema.sql` dans Supabase SQL Editor et exécutez-le
- [ ] **Activer l'authentification Email** dans Supabase : Authentication > Settings > Email

### 2. Créer un utilisateur de test

Dans Supabase SQL Editor, créez un utilisateur de test :

```sql
-- Option 1 : Via l'interface Supabase (recommandé)
-- Allez dans Authentication > Users > Add User
-- Créez un utilisateur avec email et password

-- Option 2 : Via SQL (si vous avez besoin)
-- Note : Le mot de passe doit être hashé, utilisez plutôt l'interface
```

**OU** utilisez l'inscription dans l'app une fois que tout est configuré.

### 3. Vérifier le code

- [x] ✅ `LoginScreen.js` - Logique de connexion implémentée
- [x] ✅ `authService.js` - Service d'authentification prêt
- [x] ✅ `config/supabase.js` - Configuration Supabase
- [x] ✅ `AuthContext` - Contexte d'authentification créé (optionnel mais recommandé)

### 4. Tester la connexion

1. **Lancez l'application**
2. **Allez sur l'écran de connexion**
3. **Entrez les identifiants** :
   - Email : l'email de votre utilisateur de test
   - Mot de passe : le mot de passe
4. **Cliquez sur "Se connecter"**
5. **Vérifiez** :
   - ✅ Pas d'erreur
   - ✅ Message de succès affiché
   - ✅ Retour à l'écran précédent

### 5. Gestion des erreurs

Le code gère automatiquement :
- ✅ Email vide
- ✅ Mot de passe vide
- ✅ Format d'email invalide
- ✅ Identifiants incorrects
- ✅ Email non confirmé
- ✅ Erreurs réseau

## 🔧 Dépannage

### Erreur : "Invalid API key"
- Vérifiez que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont corrects dans `config/supabase.js`
- Les credentials se trouvent dans Supabase : Settings > API

### Erreur : "relation profiles does not exist"
- Exécutez le schéma SQL dans Supabase SQL Editor
- Vérifiez que toutes les tables sont créées

### Erreur : "Invalid login credentials"
- Vérifiez que l'utilisateur existe dans Supabase : Authentication > Users
- Vérifiez que le mot de passe est correct
- Si vous avez créé l'utilisateur via SQL, utilisez plutôt l'interface Supabase

### Le profil n'est pas créé automatiquement
- Vérifiez que le trigger `handle_new_user()` existe dans Supabase
- Exécutez à nouveau le schéma SQL si nécessaire

### L'application ne se connecte pas
- Vérifiez la console pour les erreurs
- Vérifiez que Supabase est accessible depuis votre appareil
- Vérifiez que l'authentification Email est activée dans Supabase

## 📝 Prochaines étapes (optionnel)

Une fois la connexion fonctionnelle, vous pouvez :

1. **Ajouter un écran d'inscription** pour créer de nouveaux utilisateurs
2. **Ajouter la gestion de session** pour rester connecté
3. **Ajouter un écran de profil** pour afficher les informations utilisateur
4. **Protéger les routes** pour que seuls les utilisateurs connectés puissent accéder à certaines pages

## 🎯 Test rapide

Pour tester rapidement :

1. Ouvrez `config/supabase.js`
2. Remplacez `YOUR_SUPABASE_URL` et `YOUR_SUPABASE_ANON_KEY`
3. Exécutez `supabase/schema.sql` dans Supabase
4. Créez un utilisateur dans Supabase (Authentication > Users)
5. Lancez l'app et testez la connexion

Si tout fonctionne, vous verrez "Connexion réussie !" après avoir entré les bons identifiants.
