import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
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

const PRODUCTS = [
  { name: "TOÑA 12 ONZA", category_id: "cervezas", price: 70, stock: 120 },
  { name: "TOÑA LATA PEQUEÑA", category_id: "cervezas", price: 70, stock: 90 },
  { name: "TOÑA LITRO", category_id: "cervezas", price: 70, stock: 100 },
  { name: "CLASICA 12 ONZA", category_id: "cervezas", price: 75, stock: 80 },
  { name: "CLASICA LATA PEQUEÑA", category_id: "cervezas", price: 100, stock: 60 },
  { name: "CLASICA LITRO", category_id: "cervezas", price: 100, stock: 50 },
  { name: "SPARK TRIPLE BERRY", category_id: "cervezas", price: 115, stock: 45 },
  { name: "SPARK ROSADA", category_id: "cervezas", price: 100, stock: 40 },
  { name: "SPARK NAKET", category_id: "cervezas", price: 100, stock: 40 },
  { name: "SPARK MANDARINA", category_id: "cervezas", price: 100, stock: 40 },
  { name: "ULTRA TOÑA", category_id: "cervezas", price: 100, stock: 40 },
  { name: "SOL", category_id: "cervezas", price: 100, stock: 40 },
  { name: "HEINEKEN ", category_id: "cervezas", price: 100, stock: 40 },
  { name: "MILLER", category_id: "cervezas", price: 100, stock: 40 },
  { name: "SMIRNOF VERDE", category_id: "cervezas", price: 100, stock: 40 },
  { name: "SMIRNOF ROJA", category_id: "cervezas", price: 100, stock: 40 },
  { name: "BAMBU DAYKIRI", category_id: "cervezas", price: 100, stock: 40 },
  { name: "BAMBU PIÑA", category_id: "cervezas", price: 100, stock: 40 },
  { name: "RESERVA LITRO ", category_id: "licores", price: 135, stock: 30 },
  { name: "RESERVA MEDIA ", category_id: "licores", price: 195, stock: 20 },
  { name: "EXTRA LITE LITRO", category_id: "licores", price: 185, stock: 25 },
  { name: "ULTRA LITRO ", category_id: "licores", price: 265, stock: 15 },
  { name: "ULTRA MEDIA ", category_id: "licores", price: 285, stock: 12 },
  { name: "PLATA LITRO ", category_id: "licores", price: 305, stock: 10 },
  { name: "PLATA MEDIA", category_id: "licores", price: 225, stock: 18 },
  { name: "ALITAS DE 6", category_id: "comida", price: 325, stock: null },
  { name: "ALITAS DE 12", category_id: "comida", price: 285, stock: null },
  { name: "SALCHIPAPA", category_id: "comida", price: 355, stock: null },
  { name: "NACHOS", category_id: "comida", price: 135, stock: null },
  { name: "HAMBURGUESA CON PAPAS", category_id: "comida", price: 195, stock: null },
  { name: "HOT DOG SIN PAPAS", category_id: "comida", price: 125, stock: null },
  { name: "HOT DOG CON PAPAS", category_id: "comida", price: 225, stock: null },
  { name: "CONSUME DE POLLO", category_id: "comida", price: 265, stock: null },
  { name: "TOSTONASO LOCO", category_id: "comida", price: 305, stock: null },
  { name: "CHOVI NEGRA ", category_id: "Bebida sin alcohol", price: 215, stock: 50 },
  { name: "CHOVI ROJA ", category_id: "Bebida sin alcohol", price: 185, stock: 60 },
  { name: "CHOVI NARANJA ", category_id: "Bebida sin alcohol", price: 225, stock: 40 },
  { name: "CHOVI FRESCA ", category_id: "Bebida sin alcohol", price: 245, stock: 45 },
  { name: "POWER ROJO ", category_id: "Bebida sin alcohol", price: 215, stock: 35 },
  { name: "POWER AZÚL ", category_id: "Bebida sin alcohol", price: 255, stock: 40 },
  { name: "GATORADE ROJO", category_id: "Bebida sin alcohol", price: 245, stock: 30 },
  { name: "GATORADE AZÚL ", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "LIPTON LIMON", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "HICT MANZANA ", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "AGUA LITRO  ", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "AGUA MEDIO LITRO  ", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "ENSA PLASTICO  ", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "ENSA VIDRIO ", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "PEPSI VIDRIO ", category_id: "Bebida sin alcohol", price: 255, stock: 25 },
  { name: "NACHOS GRANDE", category_id: "comida", price: 255, stock: null },
  { name: "CUBETAZO TOÑA", category_id: "promociones", price: 255, stock: null },
  { name: "CUBETAZO clasica", category_id: "promociones", price: 255, stock: null }
];

async function seed() {
  console.log("Iniciando Seed de la base de datos Supabase...");

  // 1. Settings (Tasa de cambio)
  console.log("1. Insertando Settings...");
  const { error: errSettings } = await supabase.from('settings').upsert({ key: 'exchange_rate', value: '36.62' }, { onConflict: 'key' });
  if (errSettings) console.error("Error en Settings:", errSettings);

  // 2. Usuarios
  console.log("2. Insertando Usuarios (admin, cajero, mesero)...");
  for (const user of USERS) {
    const { data } = await supabase.from('users').select('username').eq('username', user.username);
    if (!data || data.length === 0) {
      const { error } = await supabase.from('users').insert(user);
      if (error) console.error(`Error al insertar usuario ${user.username}:`, error);
      else console.log(`✓ Usuario creado: ${user.username}`);
    } else {
      console.log(`- Usuario ${user.username} ya existe`);
    }
  }

  // 3. Categorías
  console.log("3. Insertando Categorías...");
  for (const cat of CATEGORIES) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'id' });
    if (error) console.error(`Error en categoría ${cat.name}:`, error);
  }

  // 4. Productos
  console.log("4. Insertando Productos (+5 pesos en precio)...");
  for (const prod of PRODUCTS) {
    const { data: existing } = await supabase.from('products').select('id').eq('name', prod.name);
    if (!existing || existing.length === 0) {
      const { error } = await supabase.from('products').insert({
        name: prod.name,
        category_id: prod.category_id,
        price: prod.price,
        stock: prod.stock,
        is_active: true
      });
      if (error) console.error(`Error al insertar producto ${prod.name}:`, error);
    } else {
      const { error } = await supabase.from('products').update({ price: prod.price }).eq('name', prod.name);
      if (error) console.error(`Error al actualizar precio del producto ${prod.name}:`, error);
    }
  }

  console.log("🎉 Seed completado exitosamente.");
}

seed().catch(console.error);
