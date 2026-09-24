import React, { useState, useEffect } from 'react';
import { useBar } from '../../context/BarContext';
import { ShieldAlert, Filter, Calendar, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, FileText } from 'lucide-react';

export const CancellationsReportView = () => {
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

  const parseStartDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T00:00:00`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const parseEndDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T23:59:59.999`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const fetchAuditLogs = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMsg('');

    const res = await loadOrderCancellations({
      startDate: parseStartDate(startDate),
      endDate: parseEndDate(endDate),
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
    fetchAuditLogs();
  }, [page, cancellationType, startDate, endDate]);

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCancellationType('');
    setPage(0);
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'parcial':
      case 'ELIMINACION_PRODUCTO':
      case 'REDUCCION_CANTIDAD':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Eliminación de producto
          </span>
        );
      case 'total':
      case 'CANCELACION_MESA':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            Cancelación de mesa
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
    <div className="bg-white border border-slate-200  shadow-sm overflow-hidden flex flex-col w-full">
      {/* Header de la Vista */}
      <div className="p-5 bg-blue-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          
          <div>
            <h2 className="text-xl font-bold m-0 tracking-tight r">Historial de Auditoría de Anulaciones</h2>
            
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAuditLogs}
          className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl border border-blue-800 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
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
              <option value="parcial">Eliminación de producto</option>
              <option value="total">Cancelación de mesa completa</option>
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

      {/* Tabla de Resultados */}
      <div className="flex-1 overflow-x-auto p-4 min-h-[400px]">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 font-medium text-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-900" />
            <span>Cargando registros de auditoría...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 font-medium text-sm flex flex-col items-center justify-center gap-2">
            <FileText className="w-10 h-10 text-slate-400" />
            <p className="m-0 font-bold text-slate-700 text-base">Sin registros de auditoría encontrados</p>
            <p className="m-0 text-xs text-slate-400">No se encontraron anulaciones con los filtros seleccionados.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 rounded-l-xl">Fecha y Hora</th>
                <th className="py-3.5 px-3">Mesa / Barra</th>
                <th className="py-3.5 px-3">Área</th>
                <th className="py-3.5 px-3">Producto</th>
                <th className="py-3.5 px-3 text-center">Cant.</th>
                <th className="py-3.5 px-3">Tipo Evento</th>
                <th className="py-3.5 px-3">Autorizado Por</th>
                <th className="py-3.5 px-3">Mesero</th>
                <th className="py-3.5 px-4 rounded-r-xl">Motivo</th>
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

      {/* Paginación */}
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
  );
};
