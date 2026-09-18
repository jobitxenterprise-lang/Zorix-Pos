import React from 'react';
import { LogOut, User, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { FaCashRegister } from "react-icons/fa";
import { useBar } from '../../context/BarContext';

export const CashierHeader = () => {
  const { currentUser, logout, isOnline, pendingSyncCount, syncOfflineQueue } = useBar();

  return (
    <header className="bg-white text-blue-950 shadow-sm border-b border-slate-200 sticky top-0 z-20 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Titulo del Sistema */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-blue-950 text-white p-1.5 sm:p-2 rounded-xl font-bold flex items-center justify-center shrink-0 shadow-sm">
            <FaCashRegister className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold font-serif tracking-tight text-blue-950 m-0 truncate">
              Caja <span className="text-blue-950 font-sans text-xs sm:text-sm font-bold bg-blue-50 px-2.5 py-0.5 rounded-full ml-1 border border-blue-200">Turno Activo</span>
            </h1>
          </div>
        </div>

        {/* Estado de Conexión, Usuario Activo y Cerrar Sesión */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Badge de Conexión Offline / Online */}
          {!isOnline ? (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-red-600" />
              <span>Offline {pendingSyncCount > 0 && `(${pendingSyncCount})`}</span>
            </div>
          ) : pendingSyncCount > 0 ? (
            <button
              onClick={syncOfflineQueue}
              className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-950 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 cursor-pointer transition-colors"
              title="Click para sincronizar ahora"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-900 animate-spin" />
              <span>Sincronizando ({pendingSyncCount})</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>En Línea</span>
            </div>
          )}

          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <User className="w-3.5 h-3.5 text-blue-950" />
              <span className="font-bold text-blue-950">{currentUser.name}</span>
              <span className="text-[10px] bg-blue-950 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                {currentUser.role}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
