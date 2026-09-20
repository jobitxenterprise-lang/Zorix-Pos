import React, { useState, useMemo } from 'react';
import { useBar } from '../../context/BarContext';
import { showSuccess } from '../../utils/swal';
import { printShiftCloseReceipt } from '../../utils/printShiftReceipt';
import { 
  X, 
  Banknote, 
  DollarSign, 
  CreditCard,
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Calculator,
  RotateCcw,
  FileText
} from 'lucide-react';

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10];

export const CierreDeCajaModal = ({ isOpen, onClose, onShiftClosed }) => {
  const context = useBar() || {};
  const { 
    paidInvoices = [], 
    shiftStartTime = null, 
    closeShift = async () => {}, 
    currentUser = null, 
    products = [], 
    categories = [], 
    currentShiftId = '',
    exchangeRate = 36.62
  } = context;

  // Estado de cantidades por billete
  const [counts, setCounts] = useState(() => 
    DENOMINATIONS.reduce((acc, denom) => ({ ...acc, [denom]: '' }), {})
  );

  // Estado de monto directo en Dólares ($ USD)
  const [usdAmount, setUsdAmount] = useState('');

  // Estado de monto directo de Vouchers de Tarjetas (C$ POS)
  const [cardAmount, setCardAmount] = useState('');
  
  // Notas / Justificación de Descuadre
  const [notes, setNotes] = useState('');
  
  // Estado de envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Cálculos de Sistema Seguros
  const safeInvoices = useMemo(() => Array.isArray(paidInvoices) ? paidInvoices : [], [paidInvoices]);
  const totalInvoicesCount = safeInvoices.length;

  const expectedCashSystem = useMemo(() => 
    safeInvoices
      .filter(i => i && i.paymentMethod === 'Efectivo')
      .reduce((sum, inv) => sum + (Number(inv?.total) || 0), 0),
    [safeInvoices]
  );

  const totalCardSystem = useMemo(() => 
    safeInvoices
      .filter(i => i && i.paymentMethod !== 'Efectivo')
      .reduce((sum, inv) => sum + (Number(inv?.total) || 0), 0),
    [safeInvoices]
  );

  const totalSalesSystem = expectedCashSystem + totalCardSystem;

  // 2. Cálculos de Arqueo Físico en Vivo
  const countedNioFromBills = useMemo(() => {
    return DENOMINATIONS.reduce((sum, denom) => {
      const qty = Number(counts[denom]) || 0;
      return sum + (qty * denom);
    }, 0);
  }, [counts]);

  const countedUsdValue = Number(usdAmount) || 0;
  const countedUsdInNio = countedUsdValue * (Number(exchangeRate) || 36.62);
  const totalPhysicalCash = countedNioFromBills + countedUsdInNio;

  const countedCardValue = Number(cardAmount) || 0;
  const totalPhysicalDeclared = totalPhysicalCash + countedCardValue;

  // 3. Diferencias y Cuadre por Método de Pago
  const cashDifference = totalPhysicalCash - expectedCashSystem;
  const cardDifference = countedCardValue - totalCardSystem;
  const netDifference = totalPhysicalDeclared - totalSalesSystem;

  const isExactMatch = Math.abs(cashDifference) < 0.01 && Math.abs(cardDifference) < 0.01;
  const isFaltante = netDifference < -0.01 || cashDifference < -0.01 || cardDifference < -0.01;
  const isSobrante = (netDifference > 0.01 || cashDifference > 0.01 || cardDifference > 0.01) && !isFaltante;

  if (!isOpen) return null;

  const handleCountChange = (denom, val) => {
    const cleanVal = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setCounts(prev => ({ ...prev, [denom]: cleanVal }));
  };

  const handleResetCounts = () => {
    setCounts(DENOMINATIONS.reduce((acc, denom) => ({ ...acc, [denom]: '' }), {}));
    setUsdAmount('');
    setCardAmount('');
    setNotes('');
    setErrorMsg('');
  };

  const handleConfirmCloseShift = async () => {
    setErrorMsg('');

    if ((isFaltante || isSobrante) && !notes.trim()) {
      setErrorMsg('Debes ingresar una nota de justificación sobre el descuadre de caja antes de continuar.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Imprimir recibo Corte Z
      try {
        printShiftCloseReceipt({
          invoices: safeInvoices,
          cashierName: currentUser?.name || 'Cajero Principal',
          startTime: shiftStartTime,
          endTime: new Date(),
          products: Array.isArray(products) ? products : [],
          categories: Array.isArray(categories) ? categories : [],
          shiftId: currentShiftId || '',
        });
      } catch (printErr) {
        console.warn('⚠️ No se pudo disparar la impresión del ticket:', printErr);
      }

      // 2. Desglose para auditoría
      const cashCountDetails = {
        denominations: counts,
        usdAmount: countedUsdValue,
        exchangeRate: Number(exchangeRate) || 36.62,
        countedNioFromBills,
        countedUsdInNio,
        totalPhysicalCash,
        expectedCashSystem,
        cashDifference,
        cardPhysicalAmount: countedCardValue,
        expectedCardSystem: totalCardSystem,
        cardDifference,
        totalPhysicalDeclared,
        totalSalesSystem,
        netDifference,
        difference: cashDifference,
      };

      // 3. Persistir en Supabase
      if (typeof closeShift === 'function') {
        await closeShift({
          cashCountDetails,
          totalRealCounted: totalPhysicalCash,
          notes: notes.trim(),
        });
      }

      if (onShiftClosed) onShiftClosed();
      onClose();
      showSuccess('¡Turno cerrado con éxito!', 'Se ha generado un nuevo turno limpio en el sistema.');
    } catch (err) {
      console.error('Error al cerrar turno:', err);
      setErrorMsg(err?.message || 'Ocurrió un error inesperado al cerrar la caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans overflow-y-auto">
      <div className="bg-white border border-blue-200 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-150">
        
        {/* Cabecera Azul Limpia */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 text-white rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white m-0 tracking-tight">Arqueo y Cierre de Caja</h3>
              <p className="text-xs text-blue-100 m-0">Ingresa la cantidad física de billetes y dólares contados</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCounts}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-red-600 hover:text-red-700 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <X className="w-6 h-6 stroke-[3px]" />
            </button>
          </div>
        </div>

        {/* Cuerpo Principal Fondo Blanco (Grid 2 Columnas) */}
        <div className="p-6 sm:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
          
          {/* Columna Izquierda: Entradas Directas de Billetes (7 Cols / 12) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 m-0">
                <Banknote className="w-5 h-5 text-blue-600" />
                Cantidad de Billetes (C$)
              </h4>
              <span className="text-xs text-slate-500 font-medium">Escribe la cantidad de cada billete</span>
            </div>

            {/* Grid 2 Columnas para Denominaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DENOMINATIONS.map(denom => {
                const qty = counts[denom];
                const subtotal = (Number(qty) || 0) * denom;

                return (
                  <div 
                    key={denom}
                    className="p-3.5 bg-slate-50 border-2 border-slate-200 hover:border-blue-300 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 bg-blue-600 text-white font-black text-xs rounded-xl min-w-[64px] text-center shadow-xs">
                        C${denom}
                      </span>
                    </div>

                    <div className="flex-1 max-w-[110px]">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={qty}
                        onChange={(e) => handleCountChange(denom, e.target.value)}
                        className="w-full py-2 px-3 bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl text-center font-extrabold text-slate-900 text-base focus:outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    <div className="text-right min-w-[75px] shrink-0">
                      <span className="text-xs font-black text-slate-700 block">
                        C${subtotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Campo para Dólares ($ USD) */}
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-800 block">Efectivo en Dólares ($ USD)</span>
                  <span className="text-xs text-slate-500 font-medium">Tasa de Cambio: C${Number(exchangeRate || 36.62).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <div className="relative w-36">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 font-extrabold text-base">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-extrabold text-slate-900 text-base text-right focus:outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="text-right min-w-[85px]">
                  <span className="text-xs font-black text-emerald-700 block">
                    C${countedUsdInNio.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Campo para Vouchers / Bauchers de Tarjetas (POS) */}
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-800 block">Total en Tarjeta </span>
                
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <div className="relative w-36">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 font-extrabold text-base">C$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl font-extrabold text-slate-900 text-base text-right focus:outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen Financiero y Cuadre (5 Cols / 12) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2 m-0 pb-2 border-b border-slate-200">
                <FileText className="w-4 h-4 text-blue-600" />
                Resumen Financiero del Turno
              </h4>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Facturas Emitidas:</span>
                  <span className="font-extrabold text-slate-900">{totalInvoicesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Ventas Tarjeta (Sistema):</span>
                  <span className="font-extrabold text-blue-600">C${totalCardSystem.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Vouchers Tarjeta (Físico):</span>
                  <span className="font-extrabold text-blue-800">C${countedCardValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Ventas Totales del Turno:</span>
                  <span className="font-black text-slate-900 text-sm">C${totalSalesSystem.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Total Esperado en Efectivo:</span>
                  <span className="font-black text-blue-700 text-base">C${expectedCashSystem.toFixed(2)}</span>
                </div>
              </div>

              {/* Total Físico Reportado */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Físico Contado (Efectivo):</span>
                <span className="text-2xl font-black text-emerald-600 block">
                  C${totalPhysicalCash.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {countedCardValue > 0 && (
                  <span className="text-xs font-extrabold text-blue-900 block pt-1 border-t border-slate-100">
                    + C${countedCardValue.toFixed(2)}Total en Tarjetas : C${totalPhysicalDeclared.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Badges de Cuadre / Descuadre */}
              <div>
                {isExactMatch && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-xs">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block uppercase">Caja Cuadrada Exacta</span>
                      <span className="text-[11px] text-emerald-700">Tanto el efectivo como las tarjetas coinciden con el sistema.</span>
                    </div>
                  </div>
                )}

                {isFaltante && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex flex-col gap-1 shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <span className="font-extrabold text-xs uppercase">Faltante Detectado</span>
                    </div>
                    {cashDifference < -0.01 && (
                      <span className="text-xs font-bold text-red-700 block">
                        • Faltante en Efectivo: C${Math.abs(cashDifference).toFixed(2)}
                      </span>
                    )}
                    {cardDifference < -0.01 && (
                      <span className="text-xs font-bold text-red-700 block">
                        • Faltante en Tarjetas: C${Math.abs(cardDifference).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {isSobrante && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-950 rounded-xl flex flex-col gap-1 shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-blue-700 shrink-0" />
                      <span className="font-extrabold text-xs uppercase">Sobrante Detectado</span>
                    </div>
                    {cashDifference > 0.01 && (
                      <span className="text-xs font-bold text-blue-900 block">
                        • Sobrante en Efectivo: +C${cashDifference.toFixed(2)}
                      </span>
                    )}
                    {cardDifference > 0.01 && (
                      <span className="text-xs font-bold text-blue-900 block">
                        • Sobrante en Tarjetas: +C${cardDifference.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Campo de Justificación / Nota obligatoria si hay descuadre */}
              {(isFaltante || isSobrante || notes.length > 0) && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Justificación / Nota del Arqueo {(isFaltante || isSobrante) && <span className="text-red-600">*</span>}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Cambio retenido, billete dañado, propina depositada..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all resize-none shadow-xs"
                  />
                </div>
              )}
            </div>

            {/* Mensaje de Error */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Botón Final de Cierre Definitivo */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmCloseShift}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-extrabold rounded-xl transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
              >
                {isSubmitting ? (
                  <span>Procesando Cierre...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar y Cerrar Caja</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
