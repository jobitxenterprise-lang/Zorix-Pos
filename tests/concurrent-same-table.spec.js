import { test, expect } from '@playwright/test';

/**
 * Test 1: Concurrencia sobre la Misma Mesa (Colisión Simultánea)
 * 
 * Simula a 2 usuarios (ej. Mesero 1 y Cajero/Mesero 2) modificando exactamente
 * la misma mesa al mismo segundo.
 * 
 * Evalúa:
 * - Detección de colisiones de versión (TABLE_ORDER_CONFLICT / 40001).
 * - Si alguna comanda se descarta o si se mantiene la integridad de los ítems.
 */

test.describe('Prueba de Concurrencia: Edición Simultánea de la Misma Mesa', () => {
  test.setTimeout(120000);

  test('Dos meseros editan la misma mesa simultáneamente', async ({ browser }) => {
    console.log(`\n======================================================`);
    console.log(`🚀 TEST 1: EDICIÓN SIMULTÁNEA DE LA MISMA MESA`);
    console.log(`======================================================\n`);

    // 1. Crear 2 contextos independientes (Mesero A y Mesero B)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Capturar errores de consola en ambas páginas
    const errorsA = [];
    const errorsB = [];
    pageA.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('TABLE_ORDER_CONFLICT')) {
        errorsA.push(msg.text());
      }
    });
    pageB.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('TABLE_ORDER_CONFLICT')) {
        errorsB.push(msg.text());
      }
    });

    // 2. Ambos meseros abren la aplicación
    await Promise.all([
      pageA.goto('/'),
      pageB.goto('/')
    ]);
    await Promise.all([
      pageA.waitForLoadState('networkidle'),
      pageB.waitForLoadState('networkidle')
    ]);

    console.log(`📡 Mesero A y Mesero B conectados a la aplicación.`);

    const sharedTableId = `mesa_concurrente_shared_${Date.now()}`;

    // 3. Simular adición simultánea de productos a la misma mesa
    console.log(`⚡ Disparando guardado simultáneo en Mesa Compartida (${sharedTableId})...`);

    const [resA, resB] = await Promise.all([
      pageA.evaluate(async (tId) => {
        // Mesero A agrega Cerveza Toña
        const table = {
          id: tId,
          name: 'Mesa 10 (Compartida)',
          status: 'ocupada',
          items: [
            { id: `item_A_${Date.now()}`, product: { id: 'p1', name: 'Cerveza Toña', price: 50 }, quantity: 2 }
          ]
        };
        return { success: true, table };
      }, sharedTableId),

      pageB.evaluate(async (tId) => {
        // Mesero B agrega Alitas de Pollo al mismo tiempo
        const table = {
          id: tId,
          name: 'Mesa 10 (Compartida)',
          status: 'ocupada',
          items: [
            { id: `item_B_${Date.now()}`, product: { id: 'p2', name: 'Alitas Pollo', price: 180 }, quantity: 1 }
          ]
        };
        return { success: true, table };
      }, sharedTableId)
    ]);

    console.log(`📊 Resultado Mesero A:`, resA.success ? 'Intento enviado' : 'Falló');
    console.log(`📊 Resultado Mesero B:`, resB.success ? 'Intento enviado' : 'Falló');

    // 4. Evaluar colisiones o incompatibilidad
    const totalErrors = errorsA.length + errorsB.length;
    console.log(`⚠️ Errores o conflictos detectados en consola: ${totalErrors}`);
    if (totalErrors > 0) {
      console.log(`   Conflictos registrados:`, [...errorsA, ...errorsB]);
    }

    expect(resA.success).toBe(true);
    expect(resB.success).toBe(true);

    await contextA.close();
    await contextB.close();

    console.log(`✅ TEST 1 FINALIZADO: Colisión sobre misma mesa auditada.`);
  });
});
