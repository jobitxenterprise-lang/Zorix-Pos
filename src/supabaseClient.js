import { createClient } from '@supabase/supabase-js';

const NEW_SUPABASE_URL = 'https://iqmxnzcztmqqxkomaeep.supabase.co';
const NEW_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbXhuemN6dG1xcXhrb21hZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTU5NjYsImV4cCI6MjEwMTQzMTk2Nn0.eSOy1dr4zOQJdF_aa3sPZmRYKNZLF-QCpQZ_1gmc-Mo';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Si la variable está vacía o apunta a proyectos anteriores (cmqpulttacvxzeipsnot o lbdrmastjmxlaqaxpqcv), forzar el nuevo proyecto activo
if (!supabaseUrl || supabaseUrl.includes('cmqpulttacvxzeipsnot') || supabaseUrl.includes('lbdrmastjmxlaqaxpqcv')) {
  supabaseUrl = NEW_SUPABASE_URL;
  supabaseAnonKey = NEW_SUPABASE_ANON_KEY;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
