import React from 'react';

export const ZONES = [
  { id: 'all', label: 'Todas las Zonas' },
  { id: 'rancho_principal', label: 'Rancho principal' },
  { id: 'rancho_2', label: 'Rancho 2' },
  { id: 'piscina_1', label: 'Piscina 1' },
  { id: 'piscina_2', label: 'Piscina 2' },
  { id: 'piscina_3', label: 'Piscina 3' },
];

const normalizeStr = (str = '') =>
  String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const isTableInZone = (table, zoneId) => {
  if (!table) return false;
  if (zoneId === 'all') return true;

  const targetZone = ZONES.find(z => z.id === zoneId) || { id: zoneId, label: zoneId.replace(/_/g, ' ') };

  const labelNorm = normalizeStr(targetZone.label);
  const idNorm = normalizeStr(targetZone.id.replace(/_/g, ' '));
  const tableAreaNorm = normalizeStr(table.area || table.zone || '');
  const tableNameNorm = normalizeStr(table.name);

  return (
    tableAreaNorm === labelNorm ||
    tableAreaNorm === idNorm ||
    table.area === targetZone.label ||
    table.area === targetZone.id ||
    tableNameNorm.includes(labelNorm)
  );
};

export const ZoneWizardPills = ({ selectedZone, onSelectZone, tables = [] }) => {
  const knownNorms = new Set(ZONES.map(z => normalizeStr(z.label)));
  const displayZones = [...ZONES];

  tables.forEach(t => {
    if (t.area && t.area.trim()) {
      const norm = normalizeStr(t.area);
      if (!knownNorms.has(norm)) {
        knownNorms.add(norm);
        displayZones.push({
          id: norm.replace(/\s+/g, '_'),
          label: t.area.trim()
        });
      }
    }
  });

  return (
    <div className="w-full my-2 bg-white">
      {/* Título centrado sin fondo oscuro */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-xs font-black text-slate-700 tracking-wider uppercase">
          Áreas del Local
        </span>
      </div>

      {/* Nav Pills Centradas en Fondo Blanco */}
      <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-1 pt-0.5 touch-pan-x custom-scrollbar flex-wrap sm:flex-nowrap">
        {displayZones.map((zone) => {
          const isActive = selectedZone === zone.id;

          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 shrink-0 flex items-center gap-2 border cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              <span>{zone.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

