-- Migration: ajouter la visibilité public/privé aux événements

ALTER TABLE events
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
CHECK (visibility IN ('private', 'public'));

-- Rendre les événements existants publics par défaut
UPDATE events
SET visibility = 'public'
WHERE visibility IS NULL;

-- Mettre à jour les politiques RLS liées à events
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Anyone can view public events" ON events;
DROP POLICY IF EXISTS "Admins can view private events" ON events;

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

