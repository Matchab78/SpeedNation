-- ============================================
-- MIGRATION: Passer de la table users à auth.users
-- ============================================
-- Ce script migre une base existante vers auth.users
-- ⚠️ ATTENTION : Sauvegardez vos données avant d'exécuter ce script !

-- Étape 1 : Créer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  profession TEXT,
  location TEXT,
  age INTEGER,
  avatar_url TEXT,
  followers_count INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Étape 2 : Migrer les données de users vers profiles (si la table users existe)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Vérifier si la table users existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Migrer les données vers profiles
    FOR user_record IN 
      SELECT * FROM users
    LOOP
      -- Insérer dans profiles si l'utilisateur existe dans auth.users
      INSERT INTO profiles (id, full_name, profession, location, age, avatar_url, followers_count, role, created_at, updated_at)
      SELECT 
        user_record.id,
        user_record.full_name,
        user_record.profession,
        user_record.location,
        user_record.age,
        user_record.avatar_url,
        user_record.followers_count,
        COALESCE(user_record.role, 'user'),
        user_record.created_at,
        user_record.updated_at
      WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = user_record.id)
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Étape 3 : Mettre à jour les références dans cars
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cars') THEN
    -- Les références devraient déjà pointer vers auth.users si les IDs correspondent
    -- Vérifier et corriger si nécessaire
    ALTER TABLE cars 
    DROP CONSTRAINT IF EXISTS cars_user_id_fkey;
    
    ALTER TABLE cars
    ADD CONSTRAINT cars_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Étape 4 : Mettre à jour les références dans events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    ALTER TABLE events 
    DROP CONSTRAINT IF EXISTS events_creator_id_fkey;
    
    ALTER TABLE events
    ADD CONSTRAINT events_creator_id_fkey 
    FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Étape 5 : Mettre à jour les références dans event_participants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_participants') THEN
    ALTER TABLE event_participants 
    DROP CONSTRAINT IF EXISTS event_participants_user_id_fkey;
    
    ALTER TABLE event_participants
    ADD CONSTRAINT event_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Étape 6 : Mettre à jour les références dans car_favorites
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_favorites') THEN
    ALTER TABLE car_favorites 
    DROP CONSTRAINT IF EXISTS car_favorites_user_id_fkey;
    
    ALTER TABLE car_favorites
    ADD CONSTRAINT car_favorites_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Étape 7 : Créer le trigger pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, profession, location, age)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'profession', NULL),
    COALESCE(NEW.raw_user_meta_data->>'location', NULL),
    (NEW.raw_user_meta_data->>'age')::INTEGER
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Étape 8 : Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Mettre à jour la politique pour les événements
DROP POLICY IF EXISTS "Only admins can create events" ON events;
CREATE POLICY "Only admins can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Note : Vous pouvez supprimer l'ancienne table users après vérification
-- DROP TABLE IF EXISTS users CASCADE;

-- TEST
