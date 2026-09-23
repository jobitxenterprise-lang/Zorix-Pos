import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqmxnzcztmqqxkomaeep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbXhuemN6dG1xcXhrb21hZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTU5NjYsImV4cCI6MjEwMTQzMTk2Nn0.eSOy1dr4zOQJdF_aa3sPZmRYKNZLF-QCpQZ_1gmc-Mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Pega aquí o pasa la lista de productos del local.
 * Formato esperado por cada ítem:
 * { name: 'Nombre Producto', category_id: 'cervezas', price: 70 }
 */
export async function importProducts(productList = []) {
  if (!productList || productList.length === 0) {
    console.log("⚠️ No se han proporcionado productos para importar.");
    return;
  }

  console.log(`📦 Importando ${productList.length} productos a la nueva instancia de Supabase...`);

  let successCount = 0;
  for (const prod of productList) {
    const { error } = await supabase.from('products').upsert({
      name: prod.name,
      category_id: prod.category_id || 'comida',
      price: prod.price || 0,
      stock: prod.stock !== undefined ? prod.stock : null,
      is_active: prod.is_active !== undefined ? prod.is_active : true
    });

    if (error) {
      console.error(`Error al importar ${prod.name}:`, error);
    } else {
      successCount++;
    }
  }

  console.log(`🎉 Se importaron ${successCount} de ${productList.length} productos correctamente.`);
}
