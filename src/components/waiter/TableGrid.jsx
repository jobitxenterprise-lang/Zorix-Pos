import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { showInputPrompt } from '../../utils/swal';
import { TableCard } from './TableCard';
import { OrderModal } from './OrderModal';
import { OpenTableModal } from '../common/OpenTableModal';
import { Modal } from '../common/Modal';
import { IoMdTime } from "react-icons/io";
import { PlusCircle, UtensilsCrossed } from "lucide-react";
import { MdLocalBar, MdTableRestaurant } from "react-icons/md";
import { WaiterHeader } from './WaiterHeader';
import { ZoneWizardPills, isTableInZone } from '../common/ZoneWizardPills';

export const TableGrid = () => {
  const { tables, addBarAccount, currentRole } = useBar();
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isOpenTableModalOpen, setIsOpenTableModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState('all');

  const selectedTable = tables.find(t => String(t.id) === String(selectedTableId));
  const filteredTables = tables.filter(t => isTableInZone(t, selectedZone));
  
  // Contadores rápidos para la barra de estado
  const occupiedTables = tables.filter(t => t.status === 'ocupada' && !t.isBar).length;
  const pendingPaymentTables = tables.filter(t => t.status === 'pendiente_pago' && !t.isBar).length;
  const barAccounts = tables.filter(t => t.isBar).length;

  return (
    <>
      <WaiterHeader />
      <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
        {/* Encabezado e Instrucciones en Fondo Blanco */}
        <div className="mb-4 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 shadow-xs">
        

          {/* Botones de Acción Alineados Estrictamente a la Derecha */}
          {currentRole !== 'cajero' && (
            <div className="flex items-center gap-2.5 ml-auto shrink-0">
              <button
                onClick={async () => {
                  const customerName = await showInputPrompt({ title: "Nueva Cuenta en Barra", text: "Ingresa el nombre del cliente:", required: true });
                  if (customerName) {
                    const newId = await addBarAccount(customerName);
                    if (newId) {
                      setSelectedTableId(newId);
                    }
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer text-xs sm:text-sm"
              >
                <span className="text-base leading-none font-black">+</span>
                <span>Barra</span>
              </button>
              
              <button
                onClick={() => setIsOpenTableModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer text-xs sm:text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Abrir Mesa</span>
              </button>
            </div>
          )}
        </div>

        {/* Wizard Nav Pill de Zonas del Local (Centrado en Fondo Blanco) */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl mb-6 shadow-xs flex flex-col items-center justify-center">
          <ZoneWizardPills
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            tables={tables}
          />
        </div>

        {/* Grilla de Mesas Activas o Estado Vacío */}
        {tables.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-xs">
            <div className="p-4 bg-slate-100 text-blue-600 rounded-2xl mb-4 border border-slate-200">
              <MdTableRestaurant className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No hay mesas ni cuentas activas</h3>
            <p className="text-slate-500 text-sm max-w-md mb-2">
              Abre una nueva mesa asignando el número de mesa y el cliente para comenzar a tomar pedidos.
            </p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px] shadow-xs">
            <h3 className="text-base font-bold text-slate-700 mb-1">No hay cuentas en esta zona</h3>
            <p className="text-slate-500 text-xs mb-3">No hay mesas activas asignadas a la zona seleccionada.</p>
            <button
              onClick={() => setSelectedZone('all')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Ver todas las zonas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => setSelectedTableId(table.id)}
              />
            ))}
          </div>
        )}

      {/* Modal para abrir nueva mesa */}
      <OpenTableModal
        isOpen={isOpenTableModalOpen}
        onClose={() => setIsOpenTableModalOpen(false)}
        onTableCreated={(newId) => setSelectedTableId(newId)}
        defaultZoneId={selectedZone}
      />

      {/* Modal para tomar pedido */}
      {selectedTable && (
        <Modal
          isOpen={Boolean(selectedTable)}
          onClose={() => setSelectedTableId(null)}
          title={`Gestión de ${selectedTable.name}`}
          maxWidth="max-w-7xl"
          height="h-[92vh]"
        >
          <OrderModal
            table={selectedTable}
            onClose={() => setSelectedTableId(null)}
          />
        </Modal>
      )}
    </div>
    </>
  );
};

