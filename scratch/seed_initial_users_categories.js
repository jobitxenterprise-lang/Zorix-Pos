import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqmxnzcztmqqxkomaeep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbXhuemN6dG1xcXhrb21hZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTU5NjYsImV4cCI6MjEwMTQzMTk2Nn0.eSOy1dr4zOQJdF_aa3sPZmRYKNZLF-QCpQZ_1gmc-Mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = [
  { id: "cervezas", name: "Cervezas", icon: "Beer" },
  { id: "licores", name: "Licores", icon: "GlassWater" },
  { id: "comida", name: "Comidas", icon: "Utensils" },
  { id: "Bebida sin alcohol", name: "Bebida sin alcohol", icon: "RiDrinks2Fill" },
  { id: "promociones", name: "promociones", icon: "MdLocalOffer" }
];

const USERS = [
  { name: 'Administrador Principal', username: 'admin', password_hash: '123456', role: 'admin', is_active: true },
  { name: 'Cajero Principal', username: 'cajero', password_hash: '123456', role: 'cajero', is_active: true },
  { name: 'Mesero Principal', username: 'mesero', password_hash: '123456', role: 'mesero', is_active: true }
];

async function seedBase() {
  console.log("🌱 Inicializando datos base en la nueva instancia de Supabase...");

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

  // 3. Categorías Base
  console.log("3. Verificando/Creando categorías...");
  for (const cat of CATEGORIES) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'id' });
    if (error) console.error(`Error en categoría ${cat.name}:`, error);
    else console.log(`  ✓ Categoría lista: ${cat.name}`);
  }

  console.log("✅ Estructura base lista. Pendiente la importación del catálogo final de productos del local.");
}

seedBase().catch(console.error);
