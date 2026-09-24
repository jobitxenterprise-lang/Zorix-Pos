// src/utils/printerService.js
// Servicio de comunicación HTTP entre React (Zorix POS) y el Agente Local (ZorixPrintAgent en http://localhost:8181)

const LOCAL_AGENT_URL = 'http://localhost:8181';

/**
 * Verificar el estado de salud del agente de impresión local
 */
export const checkPrinterAgentHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(`${LOCAL_AGENT_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return { online: false };
    const data = await response.json();
    return {
      online: true,
      agent: data.agent,
      printersCount: data.printers_count,
    };
  } catch (err) {
    return { online: false, error: err.message };
  }
};

/**
 * Enviar comanda o factura al agente de impresión local para enrutamiento por print_id
 */
export const sendToLocalPrinter = async (payload) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${LOCAL_AGENT_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    const data = await response.json();
    console.log('🖨️ [ZorixPrintAgent] Respuesta de impresión local:', data);
    return data;
  } catch (err) {
    console.warn('⚠️ [ZorixPrintAgent] No se pudo comunicar con el agente local:', err.message);
    return { success: false, error: err.message };
  }
};
