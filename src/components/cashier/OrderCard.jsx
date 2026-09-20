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
    <div className={`bg-white border-2 rounded-2xl p-5  transition-all flex flex-col justify-between h-full relative ${
      isPending ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 '
    }`}>
      
      {/* Banner de Cuenta Solicitada */}
      {isPending && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 z-10 animate-pulse">
          <Clock className="w-3 h-3" />
          <span>Cuenta Solicitada en Caja</span>
        </div>
      )}

      {/* Cabecera: Nombre de Mesa y Área */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-blue-950 tracking-tight truncate m-0">
            {table.name}
          </h3>
          <br/>
          <div className="flex items-center gap-1 text-slate-500 font-bold text-xs mt-0.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{table.area || 'Zona Principal'}</span>
          </div>
           <br/>
          <div className="text-right shrink-0 flex items-center">
        
          <span className="text-xs font-black text-blue-950 truncate max-w-[100px] block">
            {table.assignedWaiterName || 'Sin mesero'}
          </span>
        </div>
        </div>
      </div>

      {/* Pie de Tarjeta: Total y Botones de Acción */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer border border-blue-200 active:scale-95"
            >
              <IoEye className="w-4 h-4" />
              <span>Ver Detalles</span>
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={handleCancelTable}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer border border-red-200 active:scale-95"
              title="Cancelar/Eliminar Mesa"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

