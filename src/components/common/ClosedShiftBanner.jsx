import React from "react";
import { Lock, Unlock } from "lucide-react";
import { useBar } from "../../context/BarContext";

export const ClosedShiftBanner = ({ onOpenApertura, className = "" }) => {
  const { currentShiftId } = useBar();

  if (currentShiftId) return null;

  return (
    <div className={`mb-6 relative overflow-hidden bg-gradient-to-r from-white via-slate-50/80 to-indigo-50/30 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in ${className}`}>
      {/* Barra de acento izquierda */}
      <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-950 rounded-r-full" />

      <div className="flex items-center gap-3.5 pl-2">
        {/* Ícono de candado en contenedor suave */}
        <div className="w-11 h-11 rounded-xl bg-slate-100/90 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-xs">
          <Lock className="w-5 h-5 text-slate-700" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-slate-900 m-0 tracking-tight">
              Caja inactiva
            </h4>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200/70">
              Acción requerida
            </span>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-1 font-normal">
            Abre el turno para habilitar facturación, registro de cobros y arqueo de efectivo.
          </p>
        </div>
      </div>

      {onOpenApertura && (
        <button
          type="button"
          onClick={onOpenApertura}
          className="bg-blue-950  text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer shrink-0 ml-2"
        >
          <Unlock className="w-4 h-4 text-white" />
          <span>Abrir caja </span>
        </button>
      )}
    </div>
  );
};

export default ClosedShiftBanner;
