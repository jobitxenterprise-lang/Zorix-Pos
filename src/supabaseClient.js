import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vitixieioidbmjhotebu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdGl4aWVpb2lkYm1qaG90ZWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTM2NTYsImV4cCI6MjEwNTc2OTY1Nn0.wDu7pfra94adGmhlvVqMoLGora0z1d_LLesQn3N4yp0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
