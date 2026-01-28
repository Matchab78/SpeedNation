-- ============================================
-- SCRIPT DE CORRECTION : Ajouter la colonne role
-- ============================================
-- Exécutez ce script AVANT de créer la politique pour les événements
-- Si vous avez déjà créé la table users sans le champ role
-- psql -d events -f fix_add_role_column.sql
-- Étape 1 : Ajouter la colonne role si elle n'existe pas
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
    
    -- Ajouter la contrainte CHECK
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin'));
    
    -- Mettre à jour les utilisateurs existants (par défaut 'user')
    UPDATE users SET role = 'user' WHERE role IS NULL;
    
    RAISE NOTICE 'Colonne role ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne role existe déjà';
  END IF;
END $$;

-- Étape 2 : Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Only admins can create events" ON events;

-- Étape 3 : Créer la nouvelle politique pour les admins uniquement
CREATE POLICY "Only admins can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Vérification : Afficher la structure de la table users
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';
