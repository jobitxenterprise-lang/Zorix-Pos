import React, { useState, useEffect } from 'react';
import { useBar } from '../../context/BarContext';
import { X, ShieldAlert, Filter, Calendar, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, FileText } from 'lucide-react';

export const CancellationsReportModal = ({ isOpen, onClose }) => {
  const { currentUser, loadOrderCancellations } = useBar();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cancellationType, setCancellationType] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchAuditLogs = async () => {
    if (!isOpen || !currentUser) return;
    setIsLoading(true);
    setErrorMsg('');

    const res = await loadOrderCancellations({
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      cancellationType: cancellationType || null,
      limit,
      offset: page * limit,
    });

    if (res.success) {
      setLogs(res.data || []);
    } else {
      setErrorMsg(res.error || 'Error al cargar el historial de auditoría');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen, page, cancellationType]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setPage(0);
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCancellationType('');
    setPage(0);
  };

  if (!isOpen) return null;

  const getTypeBadge = (type) => {
    switch (type) {
      case 'REDUCCION_CANTIDAD':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
             Reducción
          </span>
        );
      case 'ELIMINACION_PRODUCTO':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
             Eliminación
          </span>
        );
      case 'CANCELACION_MESA':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200">
             Canc. Mesa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header del Modal */}
        <div className="px-6 py-5 bg-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-900/80 rounded-xl border border-blue-800 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold m-0 tracking-tight">Historial de Auditoría de Anulaciones</h2>
              <p className="text-xs text-blue-200 m-0 mt-0.5">
                Registro inmutable de reducciones, eliminaciones de ítems y cancelaciones de mesas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-blue-900 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-900" /> Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-950"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-900" /> Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-950"
              />
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-900" /> Tipo Anulación
              </label>
              <select
                value={cancellationType}
                onChange={(e) => setCancellationType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-950 cursor-pointer"
              >
                <option value="">Todas las anulaciones</option>
                <option value="REDUCCION_CANTIDAD">Reducción de cantidad</option>
                <option value="ELIMINACION_PRODUCTO">Eliminación de producto</option>
                <option value="CANCELACION_MESA">Cancelación de mesa completa</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" /> Filtrar
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Mensaje de Error si aplica */}
        {errorMsg && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cuerpo / Tabla de Auditoría */}
        <div className="flex-1 overflow-x-auto p-4">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 font-medium text-sm flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-900" />
              <span>Cargando registros de auditoría...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-medium text-sm flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-slate-400" />
              <p className="m-0 font-bold text-slate-700">Sin registros de auditoría encontrados</p>
              <p className="m-0 text-xs text-slate-400">No se encontraron anulaciones con los filtros seleccionados.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">Fecha y Hora</th>
                  <th className="py-3 px-3">Mesa / Barra</th>
                  <th className="py-3 px-3">Área</th>
                  <th className="py-3 px-3">Producto</th>
                  <th className="py-3 px-3 text-center">Cant.</th>
                  <th className="py-3 px-3">Tipo Evento</th>
                  <th className="py-3 px-3">Autorizado Por</th>
                  <th className="py-3 px-3">Mesero</th>
                  <th className="py-3 px-4 rounded-r-xl">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-NI', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-blue-950 whitespace-nowrap">
                      {log.table_name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                      {log.area || 'Rancho principal'}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {log.product_name}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-center text-red-600 text-sm">
                      -{log.quantity}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getTypeBadge(log.cancellation_type)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      {log.cancelled_by_name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {log.waiter_name || 'Sin mesero'}
                    </td>
                    <td className="py-3.5 px-4 italic text-slate-600 text-[11px] max-w-[200px] truncate" title={log.reason}>
                      "{log.reason}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer del Modal con Paginación */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Página <span className="font-bold text-slate-800">{page + 1}</span> (Mostrando {logs.length} registros)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              type="button"
              disabled={logs.length < limit || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
