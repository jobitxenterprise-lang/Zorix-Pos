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

export const isTableInZone = (table, zoneId, currentUserId = null) => {
  if (!table) return false;
  if (zoneId === 'my_tables') {
    return Boolean(table.assignedWaiterId) && String(table.assignedWaiterId) === String(currentUserId);
  }
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

export const ZoneWizardPills = ({ 
  selectedZone, 
  onSelectZone, 
  tables = [], 
  showTitle = false,
  myTablesCount = 0,
  showMyTables = false
}) => {
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
    <div className="flex items-center gap-2 overflow-x-auto py-0.5 touch-pan-x custom-scrollbar flex-wrap sm:flex-nowrap">
      {showTitle && (
        <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase shrink-0 mr-1 hidden lg:inline">
          Áreas:
        </span>
      )}
      {showMyTables && (
        <button
          onClick={() => onSelectZone('my_tables')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
            selectedZone === 'my_tables'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 font-semibold'
          }`}
        >
          <span>⭐ Mis Mesas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
            selectedZone === 'my_tables' ? 'bg-white text-emerald-800' : 'bg-emerald-200 text-emerald-900'
          }`}>
            {myTablesCount}
          </span>
        </button>
      )}
      {displayZones.map((zone) => {
        const isActive = selectedZone === zone.id;

        return (
          <button
            key={zone.id}
            onClick={() => onSelectZone(zone.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0 flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
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
  );
};

