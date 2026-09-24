---
name: zorix-pos-concurrency-audit
description: Guía de soporte técnico, auditoría de concurrencia y diagnóstico de rendimiento para Zorix POS bajo escenarios de alta carga (10-20 meseros concurrentes, 500-1000 mesas activas y pruebas de estrés Playwright).
---

# Auditoría de Concurrencia, Pruebas Automatizadas y Guía de Soporte Técnico — Zorix POS

## 1. Resumen Ejecutivo del Escenario de Carga y Suite de Pruebas

| Parámetro | Valor de Prueba Realista | Herramienta de Auditoría | Resultado de Integridad |
| :--- | :--- | :--- | :--- |
| **Meseros Concurrentes** | 10 a 20 dispositivos simultáneos | Playwright Browser Contexts | **PASS** (20 sesiones activas) |
| **Volumen de Mesas** | 500 mesas activas | `multi-waiter-stress.spec.js` | **500 / 500 mesas (0 corruptas)** |
| **Volumen de Ítems** | 1,000 productos asignados | Playwright Evaluate Assertions | **1,000 / 1,000 productos intactos** |
| **Edición Misma Mesa** | 2 meseros guardando al mismo tiempo | `concurrent-same-table.spec.js` | **PASS** (Conflicto auditado) |
| **Latencia Red WiFi** | Retraso artificial de 3.5 segundos | `slow-network-sync.spec.js` | **Confirmado**: Escudo expira a 2s |
| **Corte de Red (Offline)** | Desconexión total de red | `offline-retry.spec.js` | **Confirmado**: Snapshot recuperable |

---

## 2. Resultados Empíricos de la Suite de Pruebas Playwright

El proyecto cuenta con 4 pruebas automatizadas en la carpeta `tests/` que pueden ejecutarse mediante `npm run`:

### 🧪 Prueba A: `multi-waiter-stress.spec.js` (`npm run test:multi-waiter`)
- **Escenario**: 20 meseros independientes abren el sistema en paralelo e inyectan 25 mesas cada uno (Total: 500 mesas con 1,000 productos).
- **Resultado**: `1 passed (21.1s)`.
- **Hallazgo**: Ninguna mesa ni producto fue eliminado automáticamente. El estado del sistema procesa masivamente 500 mesas sin corrupción de memoria.

### 🧪 Prueba 1: `concurrent-same-table.spec.js` (`npm run test:concurrent-same-table`)
- **Escenario**: Mesero A y Mesero B envían modificaciones sobre la misma mesa en el mismo milisegundo.
- **Resultado**: `1 passed (10.7s)`.
- **Hallazgo**: Sin un algoritmo de fusión automática (*Smart Auto-Merge*), la petición que llega en segundo lugar colisiona con el código `40001` (`TABLE_ORDER_CONFLICT`). El manejo actual en el frontend descarta la segunda edición si no hay reintento con fusión.

### 🧪 Prueba 2: `slow-network-sync.spec.js` (`npm run test:slow-network`)
- **Escenario**: Inyección de latencia de 3,500 ms en peticiones de red para simular un WiFi congestionado.
- **Resultado**: `1 passed (18.6s)`.
- **Hallazgo Empírico**: A los 2,500 ms, la verificación `isShieldActive` arrojó **`FALSE (EXPIRÓ)`**. Esto demuestra científicamente que cuando la red tarda más de 2.0 segundos, el escudo optimista en `BarContext.jsx` se invalida antes de recibir la confirmación de Supabase, provocando que los ítems "desaparezcan" visualmente de la pantalla del mesero durante el retraso.

### 🧪 Prueba 3: `offline-retry.spec.js` (`npm run test:offline-retry`)
- **Escenario**: Desconexión total de red (`setOffline(true)`) al agregar productos y posterior reconexión.
- **Resultado**: `1 passed (10.8s)`.
- **Hallazgo**: El respaldo en `localStorage` (`bar_offline_snapshot_v2`) funciona y es recuperable al reconectar. Sin embargo, para evitar pérdidas se requiere una cola de reintentos en segundo plano (*Offline Retry Queue*) que envíe las peticiones acumuladas automáticamente al recuperar la señal.

---

## 3. Matriz de Vulnerabilidades y Diagnóstico de Soporte

### 🚨 Vulnerabilidad 1: Loop Cuadrático $O(T \times O)$ en `fetchData`
- **Ubicación**: `BarContext.jsx` -> `fetchData`
- **Comportamiento**: Recorre $O$ órdenes globales por cada una de las $T$ mesas ($1,000 \times 5,000 = 5,000,000$ iteraciones).
- **Síntoma**: Congelamiento de UI (2 a 5 segundos) en teléfonos móviles al recibir notificaciones Realtime.

---

### 🚨 Vulnerabilidad 2: Descarte por Colisión Concurrente (`TABLE_ORDER_CONFLICT` / `40001`)
- **Ubicación**: `BarContext.jsx` -> `performTableWrite` -> `catch`
- **Comportamiento**: Si el Cajero y un Mesero editan la misma mesa, PostgreSQL rechaza la segunda actualización. El `catch` actual borra el pendiente `pendingSyncTablesRef.delete(sTableId)`.
- **Síntoma**: El mesero reporta que "el sistema le borró la comanda", cuando en realidad fue un descarte de edición concurrente sin cola de fusión.

---

### 🚨 Vulnerabilidad 3: Expiración Prematura del Escudo Optimista (Threshold = 2000ms)
- **Ubicación**: `BarContext.jsx` -> `resolveTableItems`
- **Comportamiento**: El escudo optimista expira ciegamente a los 2,000 ms (`Date.now() - pending.timestamp < 2000`).
- **Síntoma Confirmado en Test 2**: Si la red WiFi tarda más de 2.0 segundos, los ítems desaparecen de la UI por unos segundos hasta que la llamada HTTP responde.

---

### 🚨 Vulnerabilidad 4: Limitación de `localStorage` (5 MB Quota)
- **Ubicación**: `BarContext.jsx` -> `saveOfflineSnapshot`
- **Comportamiento**: Con 1,000 mesas y 8,000 ítems, la serialización JSON supera los 5 MB arrojando `QuotaExceededError`.
- **Síntoma**: El respaldo offline falla silenciosamente.

---

## 4. Protocolo de Diagnóstico Rápido para el Equipo de Soporte

Cuando un cliente en el restaurante reporte un problema durante un turno pesado, siga este protocolo paso a paso:

```
┌────────────────────────────────────────────────────────┐
│ INCIDENTE REPORTADO POR EL RESTAURANTE                 │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
 [Caso A: "Se me borró un producto"]   [Caso B: "La pantalla se congeló"]
 1. ¿El cajero editó la misma mesa?   1. ¿Hay más de 500 mesas en turno?
    -> Buscar log 40001 (Conflict)       -> CPU saturated por filter().
 2. ¿La red WiFi estuvo lenta (>2s)?  2. Verificar consumo de RAM en
    -> Escudo expiro pre-respuesta.      dispositivo del mesero.
```

### 📋 Comandos de Diagnóstico en Consola del Navegador

1. **Verificar mesas en memoria local**:
   ```javascript
   console.log("Mesas en estado React:", JSON.parse(localStorage.getItem('bar_offline_snapshot_v2'))?.tables?.length);
   ```

2. **Verificar si hay colisiones concurrentes registradas**:
   ```javascript
   // Filtrar logs de red en DevTools por: save_table_order_audited
   // Buscar respuestas con status 400 o código 40001 (TABLE_ORDER_CONFLICT)
   ```

---

## 5. Arquitectura de Solución Propuesta (Para Implementación Futura)

Para resolver definitivamente estos comportamientos manteniendo las buenas prácticas y el skill de Supabase:

1. **Escudo Dinámico `In-Flight` (Para WiFi Lento)**:
   - Mantener el escudo optimista durante todo el tiempo que la promesa HTTP permanezca pendiente (`status: 'syncing'`), sin importar si tarda 1s, 4s u 8s.

2. **Fusión Automática `Smart Auto-Merge & Retry` (Para Colisiones)**:
   - Al recibir `TABLE_ORDER_CONFLICT`, obtener la mesa actualizada de Supabase, combinar los productos nuevos del mesero y reintentar automáticamente el RPC `save_table_order_audited`.

3. **Cola de Reintento Offline (`Offline Retry Queue`)**:
   - Si se pierde la conexión a Internet, retener las comandas en una cola local y reenviarlas automáticamente cuando el evento `online` se active.

---

## 6. Comandos para Ejecutar la Suite de Pruebas de Auditoría

```bash
# Ejecutar todas las pruebas de auditoría juntas
npm run test:audit-suite

# Ejecutar pruebas individuales
npm run test:multi-waiter          # Simulación 20 meseros y 500 mesas
npm run test:concurrent-same-table # Edición simultánea sobre la misma mesa
npm run test:slow-network          # Latencia de 3.5s en red WiFi
npm run test:offline-retry         # Caída de red y recuperación de snapshot
```

---

## 7. Incidente Real de CPU Saturada y Diagnóstico de Error `40001`

### 🚨 Incidente Registrado (24-Sep-2026)
- **Síntoma en Supabase:** Alerta "Your project is currently facing high CPU usage", pico masivo de **5,298,341 peticiones** y **5,295,553 errores** (0.1% de éxito) en un rango de pocas horas.
- **Mensaje de Error:** `40001 TABLE_ORDER_CONFLICT` repetido miles de veces por segundo en los logs de Postgres.

### 🔬 Análisis Téchnico y Causa Raíz
1. **Origen del Error `40001`:** El RPC `save_table_order_audited` utiliza Control de Concurrencia Optimista (OCC) con `v_table.order_version`. Si dos dispositivos envían modificaciones sobre la misma mesa al mismo tiempo, el segundo envío falla intencionalmente con `raise exception 'TABLE_ORDER_CONFLICT' using errcode = '40001'` para no sobreescribir productos.
2. **Causa del Pico de CPU:** El parámetro `idle_in_transaction_session_timeout` en PostgreSQL estaba en `0` (deshabilitado). Al ocurrir rechazos `40001`, las transacciones abortadas quedaban colgadas en estado `idle in transaction (aborted)` reteniendo los bloqueos `FOR UPDATE` en `pg_stat_activity`, colapsando el pool de conexiones de PostgREST / PgBouncer y disparando la CPU al 100%.

### 🛠️ Solución Aplicada e Infraestructura
1. **Configuración de Timeouts en PostgreSQL (Aplicada en Vivo):**
   ```sql
   ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '20000';
   ALTER ROLE authenticator SET idle_in_transaction_session_timeout = '20000';
   ```
2. **Protocolo de Recuperación en Caliente (Fast Reboot):**
   - Ejecutar **Restart Project -> Fast reboot** en *Project Settings -> General* de Supabase para purgar buffers WAL y conexiones colgadas residuales.
   - Los dispositivos clientes se reconectan automáticamente en 10-15 segundos.
3. **Comprobación en el Cliente (`BarContext.jsx`):**
   - El capturador `catch` en `performTableWrite` purga las escrituras pendientes (`pendingSyncTablesRef.delete(sTableId)`) al recibir `40001`, muestra la alerta de conflicto y ejecuta `fetchData(true)` para recargar la versión limpia sin entrar en bucles de reintento.

