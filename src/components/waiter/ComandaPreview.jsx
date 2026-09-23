import React, { useState } from 'react';
import { Printer, Copy, Check } from 'lucide-react';

export const ComandaPreview = ({ table, items, waiterName, isCopy = false, onClose }) => {
  const [filterTarget, setFilterTarget] = useState('all'); // 'all', 'cocina', 'bebida'
  const [copyMode, setCopyMode] = useState(isCopy);

  const handlePrint = () => {
    window.print();
    onClose();
  };

  const currentDate = new Date().toLocaleDateString('es-NI');
  const currentTime = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });

  // Clasificar ítems según tipo de comanda (comida vs bebida)
  const isComidaItem = (item) => {
    const pType = item.product?.print_type || (item.product?.category === 'comida' ? 'comida' : 'bebida');
    return pType === 'comida';
  };

  const comidaItems = items.filter(isComidaItem);
  const bebidaItems = items.filter((i) => !isComidaItem(i));

  const shouldRenderCocina = (filterTarget === 'all' || filterTarget === 'cocina') && comidaItems.length > 0;
  const shouldRenderBebida = (filterTarget === 'all' || filterTarget === 'bebida') && bebidaItems.length > 0;

  const renderTicketBlock = (sectionTitle, sectionItems, isSecond = false) => {
    if (!sectionItems || sectionItems.length === 0) return null;

    return (
      <div className={`ticket-block bg-white p-4 ${isSecond ? 'border-t-2 border-dashed border-slate-400 mt-6 pt-6 print:mt-0 print:pt-4 print:border-none' : ''} print:p-2`}>
        {/* ENCABEZADO TICKET */}
        <div className="p-3 text-center border-b border-dashed border-slate-300">
          {copyMode && (
            <div className="mb-2 bg-red-100 text-red-800 border border-red-300 font-black text-xs px-2 py-1 rounded tracking-widest uppercase print:border-black print:text-black print:bg-slate-200">
              *** COPIA DE COMANDA ***
            </div>
          )}
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-1">
            {sectionTitle}
          </h2>
          <p className="text-xs font-bold text-slate-600 mb-2">TICKET DE PREPARACIÓN</p>
          
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-1">
            <span>{currentDate}</span>
            <span>{currentTime}</span>
          </div>
        </div>

        {/* DATOS DE LA MESA */}
        <div className="px-3 py-2.5 border-b border-dashed border-slate-300 bg-slate-50 print:bg-transparent print:p-2">
          <h1 className="text-2xl font-black text-slate-900 text-center uppercase tracking-wide">
            {table.name}
          </h1>
          <p className="text-center text-xs font-bold text-slate-600 mt-0.5 uppercase">
            MESERO: {waiterName || 'NO ASIGNADO'}
          </p>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div className="px-3 py-3 print:p-2">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono">
            {sectionItems.map((item, index) => (
              <React.Fragment key={index}>
                <div className="font-black text-lg text-slate-900 pt-1 border-t border-slate-100 print:border-black/20">
                  {item.quantity}
                </div>
                <div className="font-bold text-sm sm:text-base text-slate-800 leading-tight pt-1 border-t border-slate-100 print:border-black/20">
                  {item.product?.name || item.name || 'Producto'}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center p-4 sm:p-6 z-50 print:bg-white print:p-0 overflow-y-auto">
      {/* Estilos dinámicos de impresión para división de página térmica */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-comanda-area, .printable-comanda-area * {
            visibility: visible;
          }
          .printable-comanda-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          .ticket-block {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
          }
          .ticket-block:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div className="printable-comanda-area bg-white w-full max-w-sm h-fit shadow-2xl overflow-hidden my-auto print:shadow-none print:w-[80mm] print:max-w-[80mm] rounded-2xl print:rounded-none">
        
        {/* MODO COPIA BARRA DE CONTROL */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={copyMode}
              onChange={(e) => setCopyMode(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1">
              <Copy className="w-3.5 h-3.5 text-slate-500" /> Marcar como COPIA
            </span>
          </label>
        </div>

        {/* SELECTOR DE FILTRO DE IMPRESIÓN (Ambos / Solo Cocina / Solo Barra) */}
        {comidaItems.length > 0 && bebidaItems.length > 0 && (
          <div className="p-2 bg-slate-200/70 border-b border-slate-300 flex gap-1 print:hidden">
            <button
              type="button"
              onClick={() => setFilterTarget('all')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors ${
                filterTarget === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              2 Tickets (Ambos)
            </button>
            <button
              type="button"
              onClick={() => setFilterTarget('cocina')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors ${
                filterTarget === 'cocina'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Solo Cocina
            </button>
            <button
              type="button"
              onClick={() => setFilterTarget('bebida')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors ${
                filterTarget === 'bebida'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Solo Barra
            </button>
          </div>
        )}

        {/* Renderizado separado de los bloques de comanda */}
        {shouldRenderCocina && renderTicketBlock('COMANDA - COCINA', comidaItems, false)}
        {shouldRenderBebida && renderTicketBlock('COMANDA - BEBIDA', bebidaItems, shouldRenderCocina)}

        {/* Fallback si no hay clasificación clara o filtro exclusivo */}
        {!shouldRenderCocina && !shouldRenderBebida && renderTicketBlock('COMANDA', items, false)}

        {/* PIE DE TICKET - BOTONES */}
        <div className="p-4 bg-slate-900 text-center print:hidden border-t border-slate-800">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg text-sm"
            >
              <Printer className="w-4 h-4" /> Imprimir Ticket
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};
