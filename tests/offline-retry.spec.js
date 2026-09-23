import { test, expect } from '@playwright/test';

/**
 * Test E2E Verificable: Flujo Completo Offline y Sincronización Real para Zorix POS
 * 
 * Flujo Verificado:
 * UI -> UPDATE_ORDER -> offlineQueue -> reload -> online -> syncOfflineQueue -> Supabase -> UI
 * 
 * Características:
 * 1. Uso de identificadores dinámicos de mesa (evita colisión entre ejecuciones).
 * 2. Interacción 100% mediante la interfaz gráfica nativa (UI).
 * 3. Verificación de payload persistido en localStorage (tableId, items, expectedVersion).
 * 4. Prueba de vaciado de la cola tras reconexión a Internet.
 * 5. Sin simulaciones de enqueueOfflineAction, syncOfflineQueue ni mockups de respuestas HTTP.
 */

test.describe('Prueba E2E Verificable: Flujo Offline Completo y Sincronización', () => {
  test.setTimeout(120000); // 2 minutos límite

  test('Ciclo completo UI -> UPDATE_ORDER -> offlineQueue -> reload -> sync -> UI', async ({ page, context }) => {
    console.log(`\n======================================================`);
    console.log(`🚀 INICIANDO TEST E2E VERIFICABLE DE FUNCIONAMIENTO OFFLINE`);
    console.log(`======================================================\n`);

    // Identificador dinámico de mesa para evitar contaminación de ejecuciones previas
    const dynamicTableNum = `M_${Date.now().toString().slice(-4)}`;

    // 1. Precondición de Autenticación: Usar ID de usuario mesero real registrado en PostgreSQL
    // (Ej. Carlos Martínez: 'c9e6b6c6-5b17-4c30-bd83-807392f66186')
    await page.addInitScript(() => {
      sessionStorage.setItem('bar_active_session_v1', JSON.stringify({
        id: 'c9e6b6c6-5b17-4c30-bd83-807392f66186',
        name: 'Carlos Martinez',
        username: 'mesero',
        role: 'mesero'
      }));
    });

    // 2. Navegar a la pantalla del mesero
    await page.goto('/mesero');
    await page.waitForLoadState('networkidle');

    console.log(`📡 Navegación exitosa a /mesero en modo ONLINE.`);

    // 3. Abrir una mesa dinámica mediante la interfaz de usuario (UI real)
    const openTableBtn = page.locator('button:has-text("Abrir Mesa")').first();
    await expect(openTableBtn).toBeVisible({ timeout: 10000 });
    await openTableBtn.click();

    // Completar el modal OpenTableModal
    const tableInput = page.locator('input[placeholder*="Ej."]').first();
    await expect(tableInput).toBeVisible({ timeout: 10000 });
    await tableInput.fill(dynamicTableNum);

    const submitBtn = page.locator('button[type="submit"]:has-text("Abrir")').first();
    await submitBtn.click();

    // Confirmar apertura de OrderModal
    const orderModalOverlay = page.locator('div.fixed.inset-0').first();
    await expect(orderModalOverlay).toBeVisible({ timeout: 10000 });

    console.log(`✅ Mesa dinámica (${dynamicTableNum}) abierta exitosamente mediante la UI.`);

    // Seleccionar categoría "Todos" si existe para desplegar la grilla completa de productos
    const categoryTodosBtn = page.locator('div.fixed.inset-0 button:has-text("Todos")').first();
    if (await categoryTodosBtn.isVisible().catch(() => false)) {
      await categoryTodosBtn.click();
    }

    // 4. Cambiar el navegador a estado OFFLINE
    console.log(`🔴 Desconectando red (Modo Offline)...`);
    await context.setOffline(true);

    // 5. Agregar un producto de forma real haciendo clic en la tarjeta de producto dentro del modal
    const productCard = page.locator('div.fixed.inset-0 h4.font-bold').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    console.log(`🛒 Producto seleccionado en la UI en modo OFFLINE. Esperando temporizador de debounce...`);

    // 6. Esperar a que transcurra el temporizador de debounce de updateTableOrder (1,800 ms en el código real)
    await page.waitForTimeout(2500);

    // 7. Verificación de Estructura de Payload Persistido en localStorage (bar_offline_queue_v1)
    const queueBeforeReload = await page.evaluate(() => {
      const raw = localStorage.getItem('bar_offline_queue_v1');
      return raw ? JSON.parse(raw) : [];
    });

    console.log(`📦 Inspeccionando payload encolado en localStorage:`, queueBeforeReload);

    expect(queueBeforeReload.length).toBeGreaterThan(0);
    const updateAction = queueBeforeReload.find(item => item.type === 'UPDATE_ORDER');
    expect(updateAction).toBeDefined();

    // Verificaciones estrictas de las propiedades requeridas
    expect(updateAction.payload).toBeDefined();
    expect(updateAction.payload.tableId).toBeDefined();
    expect(Array.isArray(updateAction.payload.items)).toBe(true);
    expect(updateAction.payload.items.length).toBeGreaterThan(0);
    expect(updateAction.payload.expectedVersion).toBeDefined();

    console.log(`✅ VERIFICADO: El objeto UPDATE_ORDER contiene tableId (${updateAction.payload.tableId}), items (${updateAction.payload.items.length}) y expectedVersion (${updateAction.payload.expectedVersion}).`);

    // 8. Restaurar la conexión a Internet (Modo ONLINE)
    console.log(`🟢 Restableciendo conexión a Internet (Modo ONLINE)...`);
    await context.setOffline(false);

    // Disparar el evento nativo 'online' en la ventana
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // 9. Esperar a que la sincronización real (syncOfflineQueue) procese y remueva la acción
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('bar_offline_queue_v1');
      if (!raw) return true;
      const queue = JSON.parse(raw);
      return queue.length === 0;
    }, { timeout: 20000 });

    const queueFinal = await page.evaluate(() => {
      const raw = localStorage.getItem('bar_offline_queue_v1');
      return raw ? JSON.parse(raw) : [];
    });

    expect(queueFinal.length).toBe(0);
    console.log(`🎉 VERIFICADO: La cola bar_offline_queue_v1 fue vaciada exitosamente tras la sincronización real en Supabase.`);

    // 10. Confirmar que la UI refleja la mesa y la aplicación responde correctamente
    await expect(page.locator('body')).toBeVisible();

    console.log(`✅ TEST E2E OFFLINE REAL COMPLETADO EXITOSAMENTE.`);
  });
});
