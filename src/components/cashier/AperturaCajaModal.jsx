import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { showSuccess, showError } from '../../utils/swal';
import { FaCashRegister } from 'react-icons/fa';
import { DollarSign, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const AperturaCajaModal = ({ isOpen, onClose }) => {
  const { openShift, currentUser, currentShiftId } = useBar();
  const [initialCash, setInitialCash] = useState('0.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || currentShiftId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const amount = parseFloat(initialCash);
    if (isNaN(amount) || amount < 0) {
      setErrorMsg('Por favor ingresa un fondo inicial válido (mayor o igual a C$0.00).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await openShift(amount);
      if (result && result.success) {
        showSuccess(
          '¡Caja Abierta Exitosamente!',
          `Se ha iniciado el turno compartido con un fondo inicial de C$${amount.toFixed(2)}.`
        );
        if (onClose) onClose();
      } else {
        setErrorMsg(result?.message || 'No se pudo abrir el turno de caja.');
      }
    } catch (err) {
      console.error('Error en AperturaCajaModal:', err);
      setErrorMsg('Ocurrió un fallo inesperado al abrir la caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white border border-blue-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabecera Azul del Modal */}
        <div className="bg-blue-600 px-6 py-5 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <FaCashRegister className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black m-0 tracking-tight">Apertura de Caja</h3>
              <p className="text-xs text-blue-100 m-0">Turno Compartido de POS</p>
            </div>
          </div>
        </div>

        {/* Formulario de Apertura */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          
          {/* Badge del Usuario que abre turno */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Responsable de Apertura</span>
                <span className="text-sm font-extrabold text-slate-900">{currentUser?.name || 'Cajero Principal'}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-extrabold uppercase rounded-lg">
              {currentUser?.role || 'cajero'}
            </span>
          </div>

          {/* Input de Fondo Inicial */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Fondo Inicial de Caja (C$):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold text-base">C$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 text-slate-900 rounded-2xl text-lg font-black focus:outline-none focus:bg-white transition-all shadow-xs"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Ingresa la cantidad física de dinero entregada en efectivo al iniciar la caja.
            </p>
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Aviso de Caja Compartida */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Caja Compartida:</strong> Todos los cajeros y supervisores autorizados trabajarán en este mismo turno hasta que se realice el Cierre de Caja.
            </span>
          </div>

          {/* Botón de Acción */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Abriendo Caja...' : 'Abrir Caja e Iniciar Turno'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
