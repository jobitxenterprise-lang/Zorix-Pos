import React from 'react';
import { Trash2, User, MapPin } from 'lucide-react';
import { MdTableRestaurant, MdLocalBar } from "react-icons/md";
import { useBar } from '../../context/BarContext';
import { showConfirm } from '../../utils/swal';

export const TableCard = ({ table, onClick }) => {
  const { deleteTable, currentRole, currentUser } = useBar();
  const isMesero = currentRole === 'mesero' || currentUser?.role === 'mesero';
  const isLockedForWaiter = isMesero && Boolean(table.assignedWaiterId) && table.assignedWaiterId !== currentUser?.id;

  const isOccupied = table.status === 'ocupada';
  const isPendingPayment = table.status === 'pendiente_pago';
  const isBar = table.isBar;

  let statusBadgeText = isBar ? 'Barra' : isPendingPayment ? 'En Caja' : 'Ocupada';
  let statusBadgeStyle = isPendingPayment 
    ? 'bg-blue-100 text-blue-950 border-blue-300' 
    : isBar 
    ? 'bg-slate-100 text-slate-800 border-slate-300' 
    : 'bg-blue-600 text-white border-blue-700';

  return (
    <div
      onClick={isLockedForWaiter ? undefined : onClick}
      className={`bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between min-h-[220px] relative ${
        isLockedForWaiter
          ? 'opacity-60 cursor-not-allowed select-none'
          : 'hover:-translate-y-1 cursor-pointer'
      }`}
    >
      {/* Badge de Mesa Bloqueada para Meseros No Asignados */}
      {isLockedForWaiter && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-300 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md z-20 flex items-center gap-1.5 whitespace-nowrap">
          <span>🔒 Atendida por: {table.assignedWaiterName || 'Otro Mesero'}</span>
        </div>
      )}

      {/* Cabecera: Icono, Nombre de Mesa y Área */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shrink-0">
            {isBar ? <MdLocalBar className="w-6 h-6" /> : <MdTableRestaurant className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-blue-950 tracking-tight truncate m-0">
              {table.name}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 font-bold text-xs mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{table.area || 'Zona Principal'}</span>
            </div>
          </div>
        </div>

        {!isMesero && !isLockedForWaiter && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const confirmed = await showConfirm({
                title: "Eliminar Mesa",
                text: `¿Deseas cerrar o eliminar la ${table.name}?`,
                confirmButtonText: "Sí, eliminar",
                icon: "warning"
              });
              if (confirmed) {
                deleteTable(table.id);
              }
            }}
            title="Eliminar o cancelar mesa"
            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cuerpo: Mesero y Estado */}
      <div className="py-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-bold flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Mesero:</span>
          </span>
          <span className="font-extrabold text-blue-950 truncate max-w-[120px]">
            {table.assignedWaiterName || 'Sin mesero'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-black border ${statusBadgeStyle}`}>
            {statusBadgeText}
          </span>
        </div>
      </div>

    </div>
  );
};


