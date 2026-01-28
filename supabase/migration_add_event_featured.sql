-- Migration: ajouter un indicateur d'événement mis en avant

ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);

-- Fonction sécurisée pour définir un événement mis en avant unique
CREATE OR REPLACE FUNCTION public.set_featured_event(p_event_id uuid)
RETURNS void AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur courant est admin
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can set featured event';
  END IF;

  -- Désactiver tous les événements mis en avant
  UPDATE events
  SET is_featured = FALSE
  WHERE is_featured = TRUE;

  -- Activer l'événement demandé
  UPDATE events
  SET is_featured = TRUE
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour enlever toute mise en avant
CREATE OR REPLACE FUNCTION public.clear_featured_event()
RETURNS void AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur courant est admin
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can clear featured event';
  END IF;

  UPDATE events
  SET is_featured = FALSE
  WHERE is_featured = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

