# 🔧 Correction rapide : Ajouter la colonne role

## Problème
Vous avez l'erreur : `ERROR: 42703: column users.role does not exist`

Cela signifie que la table `users` existe déjà mais sans le champ `role`.

## Solution rapide

### Option 1 : Script automatique (recommandé)

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Ajouter la colonne role si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN role TEXT DEFAULT 'user';
    
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin'));
    
    UPDATE users SET role = 'user' WHERE role IS NULL;
  END IF;
END $$;

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Only admins can create events" ON events;

-- Créer la nouvelle politique
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

### Option 2 : Utiliser le fichier fix_add_role_column.sql

1. Ouvrez le fichier `supabase/fix_add_role_column.sql`
2. Copiez tout son contenu
3. Collez-le dans Supabase SQL Editor
4. Exécutez le script

## Vérification

Après avoir exécuté le script, vérifiez que la colonne existe :

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';
```

Vous devriez voir :
```
column_name | data_type | column_default
------------|-----------|---------------
role        | text      | 'user'
```

## Créer votre premier administrateur

Une fois la colonne ajoutée, promouvez un utilisateur en admin :

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';
```

Ou trouvez l'ID de l'utilisateur d'abord :

```sql
-- Trouver votre ID utilisateur
SELECT id, email, full_name FROM users WHERE email = 'votre-email@example.com';

-- Puis promouvoir (remplacez 'user-id-ici' par l'ID réel)
UPDATE users 
SET role = 'admin' 
WHERE id = 'user-id-ici';
```
