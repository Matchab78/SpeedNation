-- Mini script pour créer conversation_hidden (suppression "pour moi")
-- Exécute ce script dans Supabase SQL Editor pour corriger l'erreur "la relation conversation_hidden n'existe pas"

-- 1) Créer la table conversation_hidden
CREATE TABLE conversation_hidden (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 2) Index pour optimiser les performances
CREATE INDEX idx_conversation_hidden_user_id ON conversation_hidden(user_id);

-- 3) Activer RLS (Row Level Security)
ALTER TABLE conversation_hidden ENABLE ROW LEVEL SECURITY;

-- 4) Policies de sécurité
CREATE POLICY "Users can see their hidden conversations" ON conversation_hidden
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can hide conversations for themselves" ON conversation_hidden
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unhide their hidden conversations" ON conversation_hidden
  FOR DELETE USING (user_id = auth.uid());

-- 5) Message de confirmation
SELECT 'conversation_hidden créée avec succès!' as status;
