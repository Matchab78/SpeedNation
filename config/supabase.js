import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ REMPLACEZ CES VALEURS PAR VOS VRAIES CRÉDENTIALS SUPABASE
// Vous pouvez les trouver dans votre projet Supabase : Settings > API
// En production, utilisez des variables d'environnement :
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cktfiiopnefkoinueyxl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGZpaW9wbmVma29pbnVleXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjQzMDAsImV4cCI6MjA4MDM0MDMwMH0.xosA0cLU5ssxL1jSdqJzSRaIwsgLFcAz6Fw2v_FgoZ8';

// Créer le client Supabase avec persistance de session
// La session est automatiquement sauvegardée dans AsyncStorage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tables disponibles
export const TABLES = {
  PROFILES: 'profiles',
  CARS: 'cars',
  EVENTS: 'events',
  EVENT_PARTICIPANTS: 'event_participants',
  CAR_FAVORITES: 'car_favorites',
};
