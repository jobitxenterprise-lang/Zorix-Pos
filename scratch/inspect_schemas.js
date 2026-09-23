import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqmxnzcztmqqxkomaeep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbXhuemN6dG1xcXhrb21hZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTU5NjYsImV4cCI6MjEwMTQzMTk2Nn0.eSOy1dr4zOQJdF_aa3sPZmRYKNZLF-QCpQZ_1gmc-Mo';

const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
const supabaseZorix = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'zorixpos' } });

async function check() {
  console.log("Checking public.products...");
  const p1 = await supabasePublic.from('products').select('*');
  console.log("Public products response:", p1.error || p1.data);

  console.log("Checking zorixpos.products...");
  const p2 = await supabaseZorix.from('products').select('*');
  console.log("Zorixpos products response:", p2.error || p2.data);
}

check();
