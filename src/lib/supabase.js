import { createClient } from '@supabase/supabase-js';

// Récupération des clés d'environnement Vite avec clés publiques de production TAARU SET
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hyhdtzndrqrjduteoaav.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aGR0em5kcnFyamR1dGVvYWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1OTYyOTgsImV4cCI6MjExMDE3MjI5OH0.d7GWSMlBOqIOeGNdjw61shXpLYMyXsO94Kxaq3vzeZk';

// Client Supabase sécurisé
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
