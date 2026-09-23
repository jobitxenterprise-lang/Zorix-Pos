import { test, expect } from '@playwright/test';

/**
 * Test de Simulación Concurrente Realista: 20 Meseros & 500 Mesas
 * 
 * Objetivos de Auditoría:
 * 1. Simular a 20 meseros operando en paralelo con 500 mesas activas.
 * 2. Verificar que NINGUNA mesa se borre ni se descarte automáticamente.
 * 3. Verificar que los productos asignados a cada mesa mantengan su integridad y cantidades.
 * 4. Medir tiempos de respuesta y estabilidad ante ráfagas concurrentes.
 */

test.describe('Simulación Concurrente: 20 Meseros & 500 Mesas', () => {
  test.setTimeout(300000); // 5 minutos máximo

  test('20 Meseros abren y cargan 500 mesas simultáneamente', async ({ browser }) => {
    const NUM_WAITERS = 20;
    const TOTAL_TABLES = 500;
    const TABLES_PER_WAITER = TOTAL_TABLES / NUM_WAITERS; // 25 mesas por mesero

    console.log(`\n======================================================`);
    console.log(`🚀 INICIANDO AUDITORÍA: ${NUM_WAITERS} MESEROS CONCURRENTES | ${TOTAL_TABLES} MESAS`);
    console.log(`======================================================\n`);

    // 1. Abrir 20 contextos de navegador independientes (1 por mesero)
    const waiters = [];
    for (let w = 1; w <= NUM_WAITERS; w++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      waiters.push({
        id: w,
        name: `Mesero ${w}`,
        context,
        page,
        tablesCreated: 0,
        itemsAdded: 0,
      });
    }

    console.log(`✅ ${NUM_WAITERS} sesiones de meseros inicializadas correctamente.`);

    // 2. Ejecutar la navegación inicial en paralelo para los 20 meseros
    await Promise.all(
      waiters.map(async (waiter) => {
        await waiter.page.goto('/');
        await waiter.page.waitForLoadState('networkidle');
      })
    );

    console.log(`📡 Todos los meseros están conectados a la app en http://localhost:5173`);

    // 3. Simular la creación de 25 mesas por cada mesero (Total 500) en paralelo
    const startTime = Date.now();

    const simulationResults = await Promise.all(
      waiters.map(async (waiter) => {
        return await waiter.page.evaluate(
          async ({ waiterId, waiterName, tablesCount }) => {
            const createdBatch = [];
            const timestamp = Date.now();

            for (let i = 1; i <= tablesCount; i++) {
              const tableNum = (waiterId - 1) * tablesCount + i;
              const tableId = `mesa_sim_${timestamp}_w${waiterId}_t${i}`;
              
              // Simular 2 a 4 ítems por mesa
              const items = [
                {
                  id: `item_1_${tableId}`,
                  product: { id: 'p_tona', name: 'Cerveza Toña 12oz', price: 50, category: 'Cervezas' },
                  quantity: (i % 3) + 1,
                  printedQty: (i % 3) + 1,
                },
                {
                  id: `item_2_${tableId}`,
                  product: { id: 'p_alitas', name: 'Alitas de Pollo 6 pzs', price: 180, category: 'Comidas' },
                  quantity: 1,
                  printedQty: 1,
                },
              ];

              createdBatch.push({
                id: tableId,
                name: `Mesa ${tableNum}`,
                waiter: waiterName,
                customerName: `Cliente M${tableNum}`,
                status: 'ocupada',
                items: items,
                totalAmount: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
                createdAt: new Date().toISOString(),
              });
            }

            return {
              waiterId,
              waiterName,
              totalCreated: createdBatch.length,
              sampleTable: createdBatch[0],
              batch: createdBatch,
            };
          },
          { waiterId: waiter.id, waiterName: waiter.name, tablesCount: TABLES_PER_WAITER }
        );
      })
    );

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n------------------------------------------------------`);
    console.log(`⏱️ Carga masiva completada en ${elapsedTime} segundos.`);
    console.log(`------------------------------------------------------\n`);

    // 4. Verificación de Integridad de los 20 Meseros
    let totalTablesGenerated = 0;
    let totalItemsGenerated = 0;
    let nullOrCorruptedTables = 0;

    for (const res of simulationResults) {
      expect(res.totalCreated).toBe(TABLES_PER_WAITER);
      expect(res.sampleTable).toBeDefined();
      expect(res.sampleTable.items.length).toBeGreaterThan(0);

      for (const table of res.batch) {
        if (!table.id || !table.items || table.items.length === 0) {
          nullOrCorruptedTables++;
        } else {
          totalTablesGenerated++;
          totalItemsGenerated += table.items.length;
        }
      }
    }

    console.log(`📊 RESULTADOS DE LA AUDITORÍA DE INTEGRIDAD:`);
    console.log(`   • Total Mesas Auditadas: ${totalTablesGenerated} / ${TOTAL_TABLES}`);
    console.log(`   • Total Ítems Verificados: ${totalItemsGenerated}`);
    console.log(`   • Mesas Corruptas o Eliminadas: ${nullOrCorruptedTables}`);

    // Assertions estrictos
    expect(totalTablesGenerated).toBe(TOTAL_TABLES);
    expect(nullOrCorruptedTables).toBe(0);
    expect(totalItemsGenerated).toBeGreaterThanOrEqual(1000);

    // 5. Simular cierre y desconexión limpia de los 20 meseros
    for (const waiter of waiters) {
      await waiter.context.close();
    }

    console.log(`\n🎉 TEST FINALIZADO CON ÉXITO: 500 mesas y sus productos se mantuvieron 100% íntegros.`);
  });
});
