import React from 'react';
import { Printer } from 'lucide-react';

export const ComandaPreview = ({ table, items, waiterName, onClose }) => {
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

  const renderTicketBlock = (sectionTitle, sectionItems, isSecond = false) => {
    if (!sectionItems || sectionItems.length === 0) return null;

    return (
      <div className={`${isSecond ? 'border-t-2 border-dashed border-slate-400 mt-6 pt-6 print:mt-4 print:pt-4' : ''}`}>
        {/* ENCABEZADO TICKET */}
        <div className="p-4 text-center border-b border-dashed border-slate-300">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-1">
            {sectionTitle}
          </h2>
          <p className="text-xs font-bold text-slate-600 mb-3">TICKET DE PREPARACIÓN</p>
          
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:p-0 print:mb-1">
            <span>{currentDate}</span>
            <span>{currentTime}</span>
          </div>
        </div>

        {/* DATOS DE LA MESA */}
        <div className="px-4 py-3 border-b border-dashed border-slate-300 bg-slate-50 print:bg-transparent print:p-2">
          <h1 className="text-2xl font-black text-slate-900 text-center uppercase tracking-wide">
            {table.name}
          </h1>
          <p className="text-center text-xs font-bold text-slate-600 mt-0.5 uppercase">
            MESERO: {waiterName || 'NO ASIGNADO'}
          </p>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div className="px-4 py-4 print:p-2">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 font-mono">
            {sectionItems.map((item, index) => (
              <React.Fragment key={index}>
                <div className="font-black text-lg text-slate-900 pt-1 border-t border-slate-100 print:border-black/10">
                  {item.quantity}
                </div>
                <div className="font-bold text-sm sm:text-base text-slate-800 leading-tight pt-1 border-t border-slate-100 print:border-black/10">
                  {item.product.name}
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
      <div className="bg-white w-full max-w-sm h-fit shadow-2xl overflow-hidden my-auto print:shadow-none print:w-[80mm] print:max-w-[80mm]">
        
        {/* Renderizado separado: COMIDA y/o BEBIDA */}
        {comidaItems.length > 0 && renderTicketBlock('COMANDA - COMIDA', comidaItems, false)}
        {bebidaItems.length > 0 && renderTicketBlock('COMANDA - BEBIDA', bebidaItems, comidaItems.length > 0)}

        {/* Fallback si no hay clasificación clara */}
        {comidaItems.length === 0 && bebidaItems.length === 0 && renderTicketBlock('COMANDA', items, false)}

        {/* PIE DE TICKET - BOTONES */}
        <div className="p-4 bg-slate-900 text-center print:hidden">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg text-sm"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};
