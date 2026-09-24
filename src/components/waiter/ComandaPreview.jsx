import React, { useState } from 'react';
import { Printer, Copy } from 'lucide-react';

export const ComandaPreview = ({ table, items, waiterName, isCopy = false, onClose }) => {
  const [filterTarget, setFilterTarget] = useState('all'); // 'all', 'cocina', 'bebida'
  const [copyMode, setCopyMode] = useState(isCopy);

  const handlePrint = () => {
    window.print();
    onClose();
  };

  const currentDate = new Date().toLocaleDateString('es-NI');
  const currentTime = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Clasificar ítems según tipo de comanda (comida vs bebida)
  const isComidaItem = (item) => {
    const pType = item.product?.print_type || (item.product?.category === 'comida' ? 'comida' : 'bebida');
    return pType === 'comida';
  };

  const comidaItems = items.filter(isComidaItem);
  const bebidaItems = items.filter((i) => !isComidaItem(i));

  const shouldRenderCocina = (filterTarget === 'all' || filterTarget === 'cocina') && comidaItems.length > 0;
  const shouldRenderBebida = (filterTarget === 'all' || filterTarget === 'bebida') && bebidaItems.length > 0;

  const orderNum = "137" + Date.now().toString().slice(-4);

  const renderTicketBlock = (sectionTitle, sectionItems, isSecond = false) => {
    if (!sectionItems || sectionItems.length === 0) return null;

    return (
      <div className={`ticket-block bg-white p-3 font-mono text-slate-900 ${isSecond ? 'border-t border-dashed border-slate-400 mt-4 pt-4 print:mt-0 print:pt-2 print:border-none' : ''} print:p-1`}>
        {/* ENCABEZADO TICKET */}
        <div className="text-center pb-2 border-b border-dashed border-slate-400 mb-2">
          {copyMode && (
            <div className="mb-1 text-[11px] font-bold text-red-600 print:text-black uppercase tracking-wider">
              *** COPIA DE COMANDA ***
            </div>
          )}
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
            {sectionTitle}
          </h2>
        </div>

        {/* METADATOS COMPACTOS ESTILO FOTO POS */}
        <div className="text-xs space-y-0.5 pb-2 border-b border-dashed border-slate-400">
          <div className="flex justify-between">
            <span className="font-semibold">Order :</span>
            <span className="font-bold">#{orderNum}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{currentDate} {currentTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Server:</span>
            <span>{waiterName || 'Caja'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Table:</span>
            <span className="font-bold">{table.name}</span>
          </div>
        </div>

        {/* ENCABEZADO ITEM */}
        <div className="pt-2 text-xs font-bold uppercase tracking-wider border-b border-dashed border-slate-300 pb-1 mb-2">
          Item
        </div>

        {/* LISTA DE PRODUCTOS (Estilo - Nx Producto) */}
        <div className="space-y-1.5 text-xs font-mono">
          {sectionItems.map((item, index) => (
            <div key={index} className="flex items-start gap-1 font-bold text-slate-900 leading-tight">
              <span className="shrink-0">- {item.quantity}x</span>
              <span className="uppercase">{item.product?.name || item.name || 'Producto'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center p-4 sm:p-6 z-50 print:bg-white print:p-0 overflow-y-auto">
      {/* Estilos compactos de impresión térmica */}
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
            width: 76mm;
            max-width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .ticket-block {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            padding: 2mm !important;
          }
          .ticket-block:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div className="printable-comanda-area bg-white w-full max-w-xs h-fit shadow-2xl overflow-hidden my-auto print:shadow-none print:w-[76mm] print:max-w-[76mm] rounded-2xl print:rounded-none">
        
        {/* MODO COPIA BARRA DE CONTROL */}
        <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
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
        {shouldRenderCocina && renderTicketBlock('COMANDA - COMIDA', comidaItems, false)}
        {shouldRenderBebida && renderTicketBlock('COMANDA - BEBIDA', bebidaItems, shouldRenderCocina)}

        {/* Fallback si no hay clasificación clara o filtro exclusivo */}
        {!shouldRenderCocina && !shouldRenderBebida && renderTicketBlock('COMANDA', items, false)}

        {/* PIE DE TICKET - BOTONES */}
        <div className="p-3 bg-slate-900 text-center print:hidden border-t border-slate-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg text-xs"
            >
              <Printer className="w-4 h-4" /> Imprimir Ticket
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};
