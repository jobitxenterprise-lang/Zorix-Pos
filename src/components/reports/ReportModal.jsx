import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useBar } from '../../context/BarContext';
import { SalesReportPDF } from './SalesReportPDF';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { 
  Calendar, 
  FileDown, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  AlertCircle, 
  RefreshCw, 
  X,
  Clock
} from 'lucide-react';

export const ReportModal = ({ isOpen, onClose }) => {
  const { currentUser } = useBar();

  // Helper para fechas por defecto en formato YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getFirstDayOfMonthStr = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getFirstDayOfMonthStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  // Atajos rápidos de fecha
  const handleSetPreset = (type) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7days') {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'month') {
      setStartDate(getFirstDayOfMonthStr());
      setEndDate(todayStr);
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor selecciona una fecha de inicio y una fecha final.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowPreview(false);

    try {
      // Ajustar fechas a inicio del día (00:00:00) y final del día (23:59:59.999) en ISO
      const startIso = new Date(`${startDate}T00:00:00`).toISOString();
      const endIso = new Date(`${endDate}T23:59:59.999`).toISOString();

      const { data, error: rpcError } = await supabase.rpc('get_financial_report', {
        p_start_date: startIso,
        p_end_date: endIso,
      });

      if (rpcError) throw rpcError;
      if (!data) throw new Error('No se recibieron datos para el rango seleccionado.');

      setReportData(data);
    } catch (err) {
      console.error('Error al generar reporte financiero:', err);
      setError(err.message || 'Error al conectar con la base de datos para generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const formatC$ = (val) => {
    const num = Number(val) || 0;
    return `C$ ${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fileName = `Reporte_Financiero_${startDate}_al_${endDate}.pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col min-h-0 overflow-hidden border border-slate-200">
        
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">
                Reporte Financiero y Balance General
              </h2>
              <p className="text-xs text-slate-400 m-0">
                Cálculo y balance consolidado generado por PostgreSQL en Supabase
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Barra de Filtros y Rango de Fechas */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Rango de Fechas
              </span>

              {/* Botones de Selección Rápida */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetPreset('today')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset('7days')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  Últimos 7 días
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset('month')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  Este Mes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-600 mb-1">Desde:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-600 mb-1">Hasta:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sm:col-span-4">
                <button
                  type="button"
                  onClick={fetchReport}
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Calcular Balance</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Resumen en Pantalla cuando hay datos */}
          {reportData && (
            <div className="space-y-4">
              {/* Tarjetas KPI Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Venta Total
                  </span>
                  <span className="text-sm sm:text-lg font-black text-white block mt-1">
                    {formatC$(reportData.summary.total_sales)}
                  </span>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Costo Mercancía
                  </span>
                  <span className="text-sm sm:text-lg font-black text-slate-800 block mt-1">
                    {formatC$(reportData.summary.total_cost)}
                  </span>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Gastos Operativos
                  </span>
                  <span className="text-sm sm:text-lg font-black text-slate-800 block mt-1">
                    {formatC$(reportData.summary.total_expenses)}
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 sm:p-4 rounded-xl">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    Ganancia Neta
                  </span>
                  <span className="text-sm sm:text-lg font-black text-emerald-800 block mt-1">
                    {formatC$(reportData.summary.net_profit)}
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 sm:p-4 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    Margen Neto
                  </span>
                  <span className="text-sm sm:text-lg font-black text-emerald-800 block mt-1">
                    {Number(reportData.summary.net_margin || 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Barra de Acciones del PDF: Descargar y Previsualizar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600 font-medium">
                  Se consolidaron <strong>{reportData.invoices?.length || 0} facturas</strong> y{' '}
                  <strong>{reportData.products?.length || 0} productos</strong> en este período.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4 text-slate-500" />
                        <span>Ocultar Vista Previa</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>Ver Vista Previa</span>
                      </>
                    )}
                  </button>

                  <PDFDownloadLink
                    document={
                      <SalesReportPDF
                        reportData={reportData}
                        adminName={currentUser?.name || 'Administrador'}
                      />
                    }
                    fileName={fileName}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {({ loading: pdfGenLoading }) => (
                      <>
                        <FileDown className="w-4 h-4" />
                        <span>{pdfGenLoading ? 'Preparando PDF...' : 'Descargar PDF'}</span>
                      </>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              {/* Visor de PDF Integrado */}
              {showPreview && (
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-inner bg-slate-900 h-[500px]">
                  <PDFViewer width="100%" height="100%" showToolbar={true}>
                    <SalesReportPDF
                      reportData={reportData}
                      adminName={currentUser?.name || 'Administrador'}
                    />
                  </PDFViewer>
                </div>
              )}
            </div>
          )}

          {/* Estado Inicial sin búsqueda */}
          {!reportData && !loading && (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
              <Receipt className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600 m-0">Selecciona el rango de fechas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Haz clic en "Calcular Balance" para obtener el cálculo consolidado del período y generar el documento PDF oficial.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
