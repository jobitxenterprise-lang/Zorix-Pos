import React, { useState } from 'react';
import { DollarSign, Clock, Users, Edit, Trash2, MapPin, User, CheckCircle } from 'lucide-react';
import { MdLocalBar, MdTableRestaurant } from "react-icons/md";
import { useBar } from '../../context/BarContext';
import { showConfirm, showError, showInputPrompt } from '../../utils/swal';
import { IoEye } from "react-icons/io5";

export const OrderCard = ({ table, onEdit }) => {
  const { deleteTable, payInvoice, cancelTableOrder, currentRole, currentUser } = useBar();
  const [isProcessing, setIsProcessing] = useState(false);

  const isPending = table.status === 'pendiente_pago';
  const total = table.items ? table.items.reduce((sum, item) => sum + (item.product?.price || item.price || 0) * item.quantity, 0) : 0;
  const canCancel = ['super_cajero', 'admin'].includes(currentRole) || ['super_cajero', 'admin'].includes(currentUser?.role);

  // Manejador del cobro directo
  const handleDirectCheckout = async () => {
    const confirmed = await showConfirm({
      title: "Confirmar Cobro",
      text: `¿Confirmas el cobro directo de ${table.name} por un total de C$${total.toFixed(2)}?`,
      confirmButtonText: "Sí, cobrar",
      icon: "question"
    });
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await payInvoice(table.id, 'Efectivo', '');
    } catch (err) {
      console.error("Error al cobrar orden:", err);
      showError("Error al procesar el cobro", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejador para cancelar/eliminar mesa previa justificación
  const handleCancelTable = async (e) => {
    e.stopPropagation();
    const reason = await showInputPrompt({
      title: "Cancelar Mesa / Cuenta",
      text: `Ingresa el motivo para eliminar/cancelar la cuenta de ${table.name}:`,
      inputPlaceholder: "Ej. Cliente canceló, cobro rechazado...",
      required: true
    });
    if (reason !== null) {
      await cancelTableOrder(table.id, reason);
    }
  };

  return (
    <div className={`bg-white border-2 rounded-2xl p-2.5 sm:p-3 transition-all flex flex-col justify-between relative ${
      isPending ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 shadow-xs'
    }`}>
      
      {/* Banner de Cuenta Solicitada */}
      {isPending && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 z-10 animate-pulse whitespace-nowrap">
          <Clock className="w-3 h-3" />
          <span>Cuenta Solicitada</span>
        </div>
      )}

      {/* Cabecera: Nombre de Mesa y Área */}
      <div className="pb-1.5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-1.5">
          <h3 className="text-sm font-extrabold text-blue-950 tracking-tight truncate m-0">
            {table.name}
          </h3>
          {canCancel && (
            <button
              type="button"
              onClick={handleCancelTable}
              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Cancelar/Eliminar Mesa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-500 font-semibold text-[10px] mt-0.5 truncate">
          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
          <span className="truncate">{table.area || 'Zona Principal'}</span>
        </div>

        <div className="flex items-center justify-between text-[10px] bg-slate-50 p-1 px-2 rounded-lg border border-slate-200 mt-1.5">
          <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
            <User className="w-3 h-3 text-blue-700 shrink-0" />
            <span>Mesero:</span>
          </span>
          <span className="font-extrabold text-blue-950 truncate max-w-[90px]">
            {table.assignedWaiterName || 'Sin mesero'}
          </span>
        </div>
      </div>

      {/* Pie de Tarjeta: Botones de Acción */}
      <div className="pt-2">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-lg text-xs transition-all cursor-pointer border border-blue-200 active:scale-95"
          >
            <IoEye className="w-3.5 h-3.5" />
            <span>Ver Detalles</span>
          </button>
        )}
      </div>
    </div>
  );
};

