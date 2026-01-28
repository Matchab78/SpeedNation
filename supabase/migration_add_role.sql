-- ============================================
-- MIGRATION: Ajout du champ role aux utilisateurs
-- ============================================
-- Ce script est pour les bases de données existantes
-- Si vous créez une nouvelle base, le schéma principal inclut déjà le champ role

-- Ajouter la colonne role si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    
    -- Mettre à jour les utilisateurs existants (par défaut 'user')
    UPDATE users SET role = 'user' WHERE role IS NULL;
  END IF;
END $$;

-- Supprimer l'ancienne politique de création d'événements si elle existe
DROP POLICY IF EXISTS "Users can create events" ON events;

-- Créer la nouvelle politique pour les admins uniquement
CREATE POLICY "Only admins can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Fonction helper pour promouvoir un utilisateur en admin
-- Utilisation: SELECT promote_to_admin('user_id_here');
CREATE OR REPLACE FUNCTION promote_to_admin(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour rétrograder un admin en user
CREATE OR REPLACE FUNCTION demote_from_admin(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET role = 'user', updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
