import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../../mock/initialData';

export const Inventory = () => {
  const { products, categories } = useBar();
  const activeCategories = categories && categories.length > 0 ? categories : CATEGORIES;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // El POS no lleva inventario numérico: esta vista conserva el catálogo disponible.
  const inventoryProducts = products;

  // Filtrado
  const filteredProducts = inventoryProducts.filter(p => {
    const matchCat = selectedCategory === 'all' || String(p.category).toLowerCase() === String(selectedCategory).toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Conteos
  const categoryCounts = activeCategories.reduce((acc, cat) => {
    acc[cat.id] = inventoryProducts.filter(p => String(p.category).toLowerCase() === String(cat.id).toLowerCase()).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      
      {/* Barra de Búsqueda */}
      <div className="w-full max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium text-slate-700 placeholder-slate-400"
          placeholder="Buscar por nombre ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Categorías (Horizontal en móviles, Sidebar en desktop) */}
        <div className="w-full lg:w-64 shrink-0">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Categorías</h3>
          <div className="flex flex-row overflow-x-auto lg:flex-col gap-1.5 pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all' ? 'bg-blue-950 text-white shadow-sm' : 'bg-white lg:bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-200 lg:border-transparent'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {inventoryProducts.length}
              </span>
            </button>

            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center justify-between gap-2 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id ? 'bg-blue-950 text-white shadow-sm' : 'bg-white lg:bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-200 lg:border-transparent'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full ${selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Tarjetas */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-5 items-start content-start">
          {filteredProducts.map(product => {
            return (
              <div key={product.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-[180px]">
                
                {/* Top Section */}
                <div className="flex justify-between items-start">
                  <span className="bg-slate-100 border border-slate-200 text-blue-950 text-[9px] font-extrabold uppercase px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>

                {/* Middle Section */}
                <div className="mt-3">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-800 text-[15px] leading-tight line-clamp-2 m-0">{product.name}</h4>
                    <span className="font-extrabold text-blue-950 text-[15px]">C${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-snug">
                    Disponible para venta sin control de existencias.
                  </p>
                </div>

                {/* Bottom Section */}
                <div className="mt-auto pt-4 flex justify-between items-end">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase block mb-0.5 text-slate-500">
                      Sin control
                    </span>
                    <span className="text-xl font-black leading-none text-blue-950">
                      —
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
