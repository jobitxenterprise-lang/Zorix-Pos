import React from 'react';
import { Shield, LogOut, User } from 'lucide-react';
import { useBar } from '../../context/BarContext';
import logo from "../../assets/Imagenes/logo.png";

export const AdminHeader = () => {
  const { currentUser, logout } = useBar();

  return (
    <header className="bg-white text-blue-950 shadow-sm border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Titulo del Sistema */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center shrink-0">
            <img src={logo} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold font-serif tracking-tight text-blue-950 m-0 truncate">
              Zorix POS <span className="text-blue-950 font-sans text-xs sm:text-sm font-bold bg-blue-50 px-2 py-0.5 rounded-full ml-1 border border-blue-200">Admin</span>
            </h1>
          </div>
        </div>

        {/* Usuario Activo y Cerrar Sesión */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
