import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lbdrmastjmxlaqaxpqcv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZHJtYXN0am14bGFxYXhwcWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjAxMDMsImV4cCI6MjEwNDk5NjEwM30.hVDNtofOOkJ8bNE3tjkBRhI_nfLIy2W0M0m0ivN-S_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Probando consulta a shift_expenses...");
  const { data, error } = await supabase.from('shift_expenses').select('*').limit(1);
  console.log("Data:", data, "Error:", error);
}

test();
