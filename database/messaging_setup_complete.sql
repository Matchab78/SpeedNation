-- SCRIPT COMPLET POUR CRÉER LA MESSAGERIE
-- Exécute ce script en une seule fois dans l'éditeur SQL Supabase

-- ÉTAPE 1: Supprimer les anciennes tables si elles existent
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- ÉTAPE 2: Créer les nouvelles tables (avec profiles au lieu de auth.users)

-- Table des conversations
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_id UUID REFERENCES messages(id),
  is_group BOOLEAN DEFAULT FALSE,
  group_name TEXT,
  group_image_url TEXT,
  
  -- Pour conversations privées entre 2 personnes
  participant1_id UUID REFERENCES profiles(id),
  participant2_id UUID REFERENCES profiles(id)
);

-- Table des participants (pour conversations de groupe)
CREATE TABLE conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  reply_to_id UUID REFERENCES messages(id)
);

-- ÉTAPE 3: Créer les index pour optimiser les performances
CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

-- ÉTAPE 4: Activer RLS (Row Level Security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 5: Créer les policies de sécurité

-- Policies pour conversations
CREATE POLICY "Users can see their conversations" ON conversations
  FOR SELECT USING (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid() OR
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid()
  );

-- Policies pour conversation_participants
CREATE POLICY "Users can see their participant records" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their participant records" ON conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participant records" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Policies pour messages
CREATE POLICY "Users can see messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
      participant1_id = auth.uid() OR 
      participant2_id = auth.uid() OR
      id IN (
        SELECT conversation_id FROM conversation_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE
      participant1_id = auth.uid() OR 
      participant2_id = auth.uid() OR
      id IN (
        SELECT conversation_id FROM conversation_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- ÉTAPE 6: Créer la fonction et le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW(), last_message_id = NEW.id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la conversation quand un message est ajouté
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- ÉTAPE 7: Message de confirmation
SELECT 'Messagerie créée avec succès!' as status;
