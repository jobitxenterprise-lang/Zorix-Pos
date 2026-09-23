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
import { ClosedShiftBanner } from '../common/ClosedShiftBanner';

export const TableGrid = () => {
  const { tables, addBarAccount, currentRole, currentUser } = useBar();
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isOpenTableModalOpen, setIsOpenTableModalOpen] = useState(false);
  
  const isMesero = currentRole === 'mesero' || currentUser?.role === 'mesero';
  const [selectedZone, setSelectedZone] = useState(() => isMesero ? 'my_tables' : 'all');

  const selectedTable = tables.find(t => String(t.id) === String(selectedTableId));
  const myTablesCount = tables.filter(
    t => t.status !== 'libre' && Boolean(t.assignedWaiterId) && String(t.assignedWaiterId) === String(currentUser?.id)
  ).length;

  const filteredTables = tables.filter(t => isTableInZone(t, selectedZone, currentUser?.id));
  
  // Contadores rápidos para la barra de estado
  const occupiedTables = tables.filter(t => t.status === 'ocupada' && !t.isBar).length;
  const pendingPaymentTables = tables.filter(t => t.status === 'pendiente_pago' && !t.isBar).length;
  const barAccounts = tables.filter(t => t.isBar).length;

  return (
    <>
      <WaiterHeader />
      <div className="w-full px-3 sm:px-6 pt-2.5 pb-6 font-sans">
        <ClosedShiftBanner />

        {/* Encabezado e Instrucciones en Fondo Blanco */}
        <div className="mb-2.5 py-2 px-3 sm:px-4 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 bg-white border border-slate-200 shadow-xs">
          <ZoneWizardPills
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            tables={tables}
            myTablesCount={myTablesCount}
            showMyTables={isMesero}
          />
          {/* Botones de Acción Alineados Estrictamente a la Derecha */}
          {currentRole !== 'cajero' && (
            <div className="flex items-center gap-2 ml-auto shrink-0">
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
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-1.5 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <span className="text-sm leading-none font-black">+</span>
                <span>Barra</span>
              </button>
              
              <button
                onClick={() => setIsOpenTableModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-1.5 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Abrir Mesa</span>
              </button>
            </div>
          )}
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
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-9 gap-3">
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

