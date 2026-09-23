import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { showInputPrompt } from '../../utils/swal';
import { OrderCard } from './OrderCard';
import { Receipt, PlusCircle, Search, X } from 'lucide-react';
import { MdLocalBar, MdTableRestaurant } from "react-icons/md";
import { OrderModal } from '../waiter/OrderModal';
import { OpenTableModal } from '../common/OpenTableModal';
import { Modal } from '../common/Modal';
import { ZoneWizardPills, isTableInZone } from '../common/ZoneWizardPills';

export const ActiveOrders = () => {
  const { tables, addBarAccount, currentRole } = useBar();
  const [orderTableToEditId, setOrderTableToEditId] = useState(null);
  const [isOpenTableModalOpen, setIsOpenTableModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');

  // Consideramos 'ocupada' o 'pendiente_pago' como activas
  const activeTables = tables.filter(t => t.status === 'ocupada' || t.status === 'pendiente_pago');
  const orderTableToEdit = tables.find(t => String(t.id) === String(orderTableToEditId));

  const normalize = (text = '') =>
    String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const filteredTables = activeTables.filter(t => {
    const matchesZone = isTableInZone(t, selectedZone);
    if (!matchesZone) return false;

    if (!searchTerm.trim()) return true;
    const term = normalize(searchTerm);
    const matchName = normalize(t.name).includes(term);
    const matchCustomer = normalize(t.customerName).includes(term);
    const matchWaiter = normalize(t.assignedWaiterName).includes(term);
    const matchId = normalize(t.id).includes(term);
    return matchName || matchCustomer || matchWaiter || matchId;
  });

  const handleCreateBarAccount = async () => {
    const customerName = await showInputPrompt({ title: "Nueva Cuenta en Barra", text: "Ingresa el nombre del cliente:", required: true });
    if (customerName) {
      const newId = await addBarAccount(customerName);
      if (newId) {
        setOrderTableToEditId(newId);
      }
    }
  };

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-blue-950 m-0">Pedidos Activos en Vivo</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Supervisión, edición y cobro directo en tiempo real</p>
        </div>

        {currentRole === 'admin' && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={handleCreateBarAccount}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer text-xs"
            >
              <MdLocalBar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Despachar Barra</span>
            </button>

            <button
              onClick={() => setIsOpenTableModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Despachar Mesa</span>
            </button>
          </div>
        )}
      </div>

      {/* Buscador de Mesas y Cuentas de Barra */}
      {activeTables.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por mesa, barra o mesero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
              <span>Mostrando <strong>{filteredTables.length}</strong> de {activeTables.length} cuentas activas</span>
            </div>
          </div>

          {/* Wizard Nav Pill de Zonas del Local */}
          <div className="bg-white py-1.5 px-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <ZoneWizardPills
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              tables={activeTables}
            />
          </div>
        </div>
      )}

      {activeTables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[40vh] p-6 text-center">
          <Receipt className="w-12 h-12 sm:w-16 sm:h-16 opacity-30 mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-500 m-0">No hay pedidos activos</h3>
          <p className="text-xs sm:text-sm mt-1 max-w-sm">Las mesas que los meseros o cajeros vayan abriendo aparecerán aquí en tiempo real.</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[30vh] p-6 text-center bg-white rounded-2xl border border-slate-200">
          <Search className="w-10 h-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-600 m-0">No se encontraron coincidencias</h3>
          <p className="text-xs text-slate-400 mt-1">Ninguna mesa o cuenta coincide con "{searchTerm}".</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-9 gap-3 items-stretch pb-10">
          {filteredTables.map(table => (
            <OrderCard 
              key={table.id} 
              table={table} 
              onEdit={() => setOrderTableToEditId(table.id)}
            />
          ))}
        </div>
      )}

      {/* Modal para abrir nueva mesa */}
      <OpenTableModal
        isOpen={isOpenTableModalOpen}
        onClose={() => setIsOpenTableModalOpen(false)}
        onTableCreated={(newId) => setOrderTableToEditId(newId)}
      />

      {/* Modal para editar/crear pedido */}
      {orderTableToEdit && (
        <Modal
          isOpen={Boolean(orderTableToEdit)}
          onClose={() => setOrderTableToEditId(null)}
          title={`Gestión de ${orderTableToEdit.name}`}
          maxWidth="max-w-7xl"
          height="h-[92vh]"
        >
          <OrderModal
            table={orderTableToEdit}
            onClose={() => setOrderTableToEditId(null)}
          />
        </Modal>
      )}
    </div>
  );
};


