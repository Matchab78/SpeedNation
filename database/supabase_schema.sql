-- Schema Supabase pour SpeedNation
-- Exécutez ce script dans le SQL Editor de Supabase

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles (données utilisateur supplémentaires)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text,
  profession text,
  location text,
  age integer,
  avatar_url text,
  followers_count integer DEFAULT 0,
  role text DEFAULT 'user' CHECK (role = ANY (ARRAY['user', 'admin'])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  show_role_public boolean DEFAULT true,
  show_admin_role boolean DEFAULT true,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table cars
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  brand text,
  model text,
  year integer,
  price_purchased numeric NOT NULL,
  power_hp integer NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cars_pkey PRIMARY KEY (id),
  CONSTRAINT cars_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time without time zone,
  location text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility = ANY (ARRAY['private', 'public'])),
  is_featured boolean NOT NULL DEFAULT false,
  max_participants integer,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table event_participants
CREATE TABLE IF NOT EXISTS public.event_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_participants_pkey PRIMARY KEY (id),
  CONSTRAINT event_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table car_favorites
CREATE TABLE IF NOT EXISTS public.car_favorites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  car_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT car_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT car_favorites_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE,
  CONSTRAINT car_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_message_id uuid,
  is_group boolean DEFAULT false,
  group_name text,
  group_image_url text,
  participant1_id uuid,
  participant2_id uuid,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_participant1_id_fkey FOREIGN KEY (participant1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT conversations_participant2_id_fkey FOREIGN KEY (participant2_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_last_message FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL
);

-- Table conversation_participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  user_id uuid,
  joined_at timestamp with time zone DEFAULT now(),
  is_admin boolean DEFAULT false,
  last_read_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Table messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  sender_id uuid,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type = ANY (ARRAY['text', 'image', 'file'])),
  file_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  reply_to_id uuid,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL
);

-- Table conversation_hidden
CREATE TABLE IF NOT EXISTS public.conversation_hidden (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  hidden_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_hidden_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_hidden_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT conversation_hidden_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Table follows
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_follower FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_following FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_hidden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies pour cars
CREATE POLICY "Anyone can view cars"
  ON public.cars FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own cars"
  ON public.cars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars"
  ON public.cars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars"
  ON public.cars FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies pour events
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own events"
  ON public.events FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies pour event_participants
CREATE POLICY "Users can view event participants"
  ON public.event_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join events"
  ON public.event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events"
  ON public.event_participants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies pour car_favorites
CREATE POLICY "Users can view favorites"
  ON public.car_favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own favorites"
  ON public.car_favorites FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies pour conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (
    participant1_id = auth.uid() OR
    participant2_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    participant1_id = auth.uid() OR
    participant2_id = auth.uid()
  );

-- RLS Policies pour messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS Policies pour follows
CREATE POLICY "Users can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON public.follows FOR ALL
  USING (follower_id = auth.uid());

-- Trigger pour créer automatiquement un profile après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
