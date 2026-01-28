import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";


const SUPABASE_URL = "https://cktfiiopnefkoinueyxl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdGZpaW9wbmVma29pbnVleXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjQzMDAsImV4cCI6MjA4MDM0MDMwMH0.xosA0cLU5ssxL1jSdqJzSRaIwsgLFcAz6Fw2v_FgoZ8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});