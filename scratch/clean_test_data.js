import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqmxnzcztmqqxkomaeep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbXhuemN6dG1xcXhrb21hZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTU5NjYsImV4cCI6MjEwMTQzMTk2Nn0.eSOy1dr4zOQJdF_aa3sPZmRYKNZLF-QCpQZ_1gmc-Mo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanTestData() {
  console.log("🧹 Iniciando limpieza de datos de prueba en la nueva instancia de Supabase...");

  // 1. Eliminar invoice_items
  console.log("1. Eliminando 'invoice_items'...");
  const { error: errItems } = await supabase.from('invoice_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errItems) console.error("Error en invoice_items:", errItems);
  else console.log("✓ invoice_items limpiado");

  // 2. Eliminar invoices
  console.log("2. Eliminando 'invoices'...");
  const { error: errInvoices } = await supabase.from('invoices').delete().neq('id', '');
  if (errInvoices) console.error("Error en invoices:", errInvoices);
  else console.log("✓ invoices limpiado");

  // 3. Eliminar expenses
  console.log("3. Eliminando 'expenses'...");
  const { error: errExpenses } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errExpenses) console.error("Error en expenses:", errExpenses);
  else console.log("✓ expenses limpiado");

  // 4. Eliminar orders
  console.log("4. Eliminando 'orders'...");
  const { error: errOrders } = await supabase.from('orders').delete().gt('id', 0);
  if (errOrders) console.error("Error en orders:", errOrders);
  else console.log("✓ orders limpiado");

  // 5. Eliminar tables
  console.log("5. Eliminando 'tables'...");
  const { error: errTables } = await supabase.from('tables').delete().neq('id', '');
  if (errTables) console.error("Error en tables:", errTables);
  else console.log("✓ tables limpiado");

  // 6. Eliminar shifts
  console.log("6. Eliminando 'shifts'...");
  const { error: errShifts } = await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errShifts) console.error("Error en shifts:", errShifts);
  else console.log("✓ shifts limpiado");

  console.log("✨ Limpieza de registros de prueba completada.");
}

cleanTestData().catch(console.error);
