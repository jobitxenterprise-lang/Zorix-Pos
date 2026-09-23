import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vitixieioidbmjhotebu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdGl4aWVpb2lkYm1qaG90ZWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTM2NTYsImV4cCI6MjEwNTc2OTY1Nn0.wDu7pfra94adGmhlvVqMoLGora0z1d_LLesQn3N4yp0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const USERS = [
  { name: 'Administrador Principal', username: 'admin', password_hash: '123456', role: 'admin', is_active: true },
  { name: 'Cajero Principal', username: 'cajero', password_hash: '123456', role: 'cajero', is_active: true },
  { name: 'Mesero Principal', username: 'mesero', password_hash: '123456', role: 'mesero', is_active: true }
];

async function seedBase() {
  console.log("🌱 Inicializando usuarios base y settings en el NUEVO proyecto de Supabase (vitixieioidbmjhotebu)...");

  // 1. Settings
  console.log("1. Configurando Tasa de Cambio en Settings...");
  const { error: errSettings } = await supabase.from('settings').upsert({ key: 'exchange_rate', value: '36.62' }, { onConflict: 'key' });
  if (errSettings) console.error("Error en Settings:", errSettings);

  // 2. Usuarios Base
  console.log("2. Verificando/Creando usuarios (admin, cajero, mesero)...");
  for (const user of USERS) {
    const { data } = await supabase.from('users').select('username').eq('username', user.username);
    if (!data || data.length === 0) {
      const { error } = await supabase.from('users').insert(user);
      if (error) console.error(`Error al insertar usuario ${user.username}:`, error);
      else console.log(`  ✓ Usuario creado: ${user.username}`);
    } else {
      console.log(`  - Usuario ${user.username} ya existe`);
    }
  }

  console.log("✅ Usuarios base y ajustes listos.");
}

seedBase().catch(console.error);
