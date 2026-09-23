import React from 'react';
import { Trash2, User, MapPin } from 'lucide-react';
import { MdTableRestaurant, MdLocalBar } from "react-icons/md";
import { useBar } from '../../context/BarContext';
import { showConfirm } from '../../utils/swal';

export const TableCard = ({ table, onClick }) => {
  const { deleteTable, currentRole, currentUser } = useBar();
  const isMesero = currentRole === 'mesero' || currentUser?.role === 'mesero';
  const isCajero = currentRole === 'cajero' || currentUser?.role === 'cajero';
  const canDeleteTable = !isMesero && !isCajero && ['super_cajero', 'admin'].includes(currentRole || currentUser?.role);
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
      className={`bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-2.5 sm:p-3 shadow-xs transition-all flex flex-col justify-between min-h-[135px] relative ${
        isLockedForWaiter
          ? 'opacity-60 cursor-not-allowed select-none'
          : 'hover:-translate-y-0.5 cursor-pointer'
      }`}
    >
      {/* Badge de Mesa Bloqueada para Meseros No Asignados */}
      {isLockedForWaiter && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-300 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md z-20 flex items-center gap-1 whitespace-nowrap">
          <span>🔒 {table.assignedWaiterName || 'Otro Mesero'}</span>
        </div>
      )}

      {/* Cabecera: Icono, Nombre de Mesa y Área */}
      <div className="flex items-start justify-between gap-1.5 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 shrink-0">
            {isBar ? <MdLocalBar className="w-4 h-4" /> : <MdTableRestaurant className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-blue-950 tracking-tight truncate m-0">
              {table.name}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 font-semibold text-[10px] mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">{table.area || 'Zona Principal'}</span>
            </div>
          </div>
        </div>

        {canDeleteTable && !isLockedForWaiter && (
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
            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cuerpo: Mesero y Estado */}
      <div className="pt-1.5 space-y-1">
        <div className="flex items-center justify-between text-[10px] bg-slate-50 p-1 px-2 rounded-lg border border-slate-200">
          <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
            <User className="w-3 h-3 text-blue-700 shrink-0" />
            <span>Mesero:</span>
          </span>
          <span className="font-extrabold text-blue-950 truncate max-w-[90px]">
            {table.assignedWaiterName || 'Sin mesero'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadgeStyle}`}>
            {statusBadgeText}
          </span>
        </div>
      </div>

    </div>
  );
};


