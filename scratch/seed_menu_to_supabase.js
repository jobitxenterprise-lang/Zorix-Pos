import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://vitixieioidbmjhotebu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdGl4aWVpb2lkYm1qaG90ZWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTM2NTYsImV4cCI6MjEwNTc2OTY1Nn0.wDu7pfra94adGmhlvVqMoLGora0z1d_LLesQn3N4yp0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedMenu() {
  const dataPath = path.join(process.cwd(), 'scratch', 'menu_data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const { categories, products } = JSON.parse(raw);

  console.log(`🚀 Cargando menú oficial en NUEVO proyecto Supabase (vitixieioidbmjhotebu)...`);
  console.log(`📂 Categorías: ${categories.length}`);
  console.log(`📦 Productos: ${products.length}`);

  // 1. Insertar Categorías
  console.log("\n1. Insertando Categorías...");
  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Error en categoría ${cat.name}:`, error);
    } else {
      console.log(`  ✓ Categoría lista: ${cat.name} (${cat.id})`);
    }
  }

  // 2. Limpiar productos viejos si existen
  console.log("\n2. Limpiando productos anteriores...");
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Insertar Productos del Menú
  console.log("\n3. Insertando 116 productos con print_type...");
  let successCount = 0;
  for (const prod of products) {
    const { error } = await supabase.from('products').insert(prod);
    if (error) {
      console.error(`  ❌ Error al insertar ${prod.name}:`, error.message);
    } else {
      successCount++;
    }
  }

  console.log(`\n🎉 Proceso completado: ${successCount} de ${products.length} productos cargados exitosamente en el NUEVO proyecto.`);
}

seedMenu().catch(console.error);
