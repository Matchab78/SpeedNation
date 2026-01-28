-- ============================================
-- SCHÉMA DE BASE DE DONNÉES SPEEDNATION
-- Utilise auth.users de Supabase pour l'authentification
-- ============================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles (profil utilisateur)
-- ============================================
-- Cette table stocke les données supplémentaires des utilisateurs
-- L'authentification est gérée par auth.users (Supabase)
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- TABLE: cars (voitures)
-- ============================================
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Porsche 911 GT3 • 2023"
  brand TEXT, -- Ex: "Porsche"
  model TEXT, -- Ex: "911 GT3"
  year INTEGER, -- Ex: 2023
  price_purchased DECIMAL(12, 2) NOT NULL, -- Prix d'achat en euros
  power_hp INTEGER NOT NULL, -- Puissance en chevaux
  image_url TEXT, -- URL de la photo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at DESC);

-- ============================================
-- TABLE: events (événements)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);

-- ============================================
-- TABLE: event_participants (participants aux événements)
-- ============================================
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- ============================================
-- TABLE: car_favorites (favoris de voitures)
-- ============================================
CREATE TABLE IF NOT EXISTS car_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_car_favorites_user_id ON car_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_car_favorites_car_id ON car_favorites(car_id);

-- ============================================
-- TRIGGER: Créer automatiquement un profil lors de l'inscription
-- ============================================
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

-- Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_favorites ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour cars
CREATE POLICY "Anyone can view cars" ON cars
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour events
CREATE POLICY "Anyone can view public events" ON events
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Admins can view private events" ON events
  FOR SELECT USING (
    visibility = 'private' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Seuls les administrateurs peuvent créer des événements
CREATE POLICY "Only admins can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = creator_id);

-- Politiques pour event_participants
CREATE POLICY "Anyone can view participants" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join events" ON event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events" ON event_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour car_favorites
CREATE POLICY "Users can view their own favorites" ON car_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON car_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" ON car_favorites
  FOR DELETE USING (auth.uid() = user_id);
