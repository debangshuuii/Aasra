import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vfvmmyzqqjhumiopwxpt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdm1teXpxcWpodW1pb3B3eHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzA3ODUsImV4cCI6MjEwNDYwNjc4NX0.XhHXI_ERU_KBIrBybzBfKhgbrmg7e7YOXLbiQJ7DUR0';

if (!supabaseAnonKey) {
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY is not defined. Please set it in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
