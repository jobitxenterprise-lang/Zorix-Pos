import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://iqmxnzcztmqqxkomaeep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbXhuemN6dG1xcXhrb21hZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTU5NjYsImV4cCI6MjEwMTQzMTk2Nn0.eSOy1dr4zOQJdF_aa3sPZmRYKNZLF-QCpQZ_1gmc-Mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedMenu() {
  const dataPath = path.join(process.cwd(), 'scratch', 'menu_data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const { categories, products } = JSON.parse(raw);

  console.log(`🚀 Cargando menú oficial en Supabase...`);
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
  const { error: errDel } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errDel) {
    console.error("  ⚠️ Error al limpiar productos antiguos (posiblemente la tabla esté vacía):", errDel.message);
  } else {
    console.log("  ✓ Tabla de productos reiniciada.");
  }

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

  console.log(`\n🎉 Proceso completado: ${successCount} de ${products.length} productos cargados exitosamente.`);
}

seedMenu().catch(console.error);
