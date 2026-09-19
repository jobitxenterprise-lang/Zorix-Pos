import React, { useState, useMemo } from 'react';
import { useBar } from '../../context/BarContext';
import { showAlert, showError } from '../../utils/swal';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  CheckCircle, 
  DollarSign, 
  CreditCard, 
  ArrowRight, 
  User, 
  RotateCcw,
  PackageCheck

} from 'lucide-react';
import { CgShoppingBag } from "react-icons/cg";
import { MdLocalOffer, MdTableRestaurant } from 'react-icons/md';


const printComandaTicket = ({ items, customerName, cashierName }) => {
  const dateStr = new Date().toLocaleDateString('es-NI');
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const itemsHtml = items.map(i => `
    <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; margin-bottom:4px;">
      <span>${i.quantity}x ${i.product.name}</span>
    </div>
  `).join('');

  const content = `
    <div style="text-align: center; font-family: monospace;">
      <h2 style="font-size:22px; margin:0;">ZORIX POS</h2>
      <h3 style="font-size:16px; margin:4px 0;">COMANDA - VENTA AL DÍA</h3>
      <div style="border-top:1px dashed #000; margin:8px 0;"></div>
      <div style="text-align:left; font-size:14px;">
        <div><strong>Fecha:</strong> ${dateStr} ${timeStr}</div>
        <div><strong>Cliente:</strong> ${customerName}</div>
        <div><strong>Cajero:</strong> ${cashierName}</div>
      </div>
      <div style="border-top:1px dashed #000; margin:8px 0;"></div>
      ${itemsHtml}
      <div style="border-top:1px dashed #000; margin:8px 0;"></div>
    </div>
  `;

  const printWin = window.open("", "_blank", "width=380,height=600");
  if (printWin) {
    printWin.document.write(`<html><body>${content}<script>window.onload=function(){window.print();window.close();}</script></body></html>`);
    printWin.document.close();
  }
};

const printInvoiceTicket = ({ invoiceId, customerName, cashierName, items, total, paymentMethod }) => {
  const dateStr = new Date().toLocaleDateString('es-NI');
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const itemsHtml = items.map(i => `
    <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:3px;">
      <span>${i.quantity}x ${(i.product?.name || i.name)}</span>
      <strong>C$${((i.product?.price || i.price || 0) * i.quantity).toFixed(2)}</strong>
    </div>
  `).join('');

  const content = `
    <div style="text-align: center; font-family: monospace;">
      <h2 style="font-size:24px; margin:0;">ZORIX POS</h2>
      <h3 style="font-size:14px; margin:2px 0;">FACTURA DE VENTA</h3>
      <div style="font-size:12px;"># ${invoiceId}</div>
      <div style="border-top:1px dashed #000; margin:8px 0;"></div>
      <div style="text-align:left; font-size:13px;">
        <div><strong>Fecha:</strong> ${dateStr} ${timeStr}</div>
        <div><strong>Ubicación:</strong> Venta al Día (Mostrador)</div>
        <div><strong>Cliente:</strong> ${customerName}</div>
        <div><strong>Cajero:</strong> ${cashierName}</div>
        <div><strong>Método de Pago:</strong> ${paymentMethod}</div>
      </div>
      <div style="border-top:1px dashed #000; margin:8px 0;"></div>
      ${itemsHtml}
      <div style="border-top:1px dashed #000; margin:8px 0;"></div>
      <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:bold;">
        <span>TOTAL:</span>
        <span>C$${total.toFixed(2)}</span>
      </div>
      <div style="border-top:1px dashed #000; margin:8px 0;"></div>
      <div style="font-size:12px; font-weight:bold;">¡Gracias por su compra!</div>
    </div>
  `;

  const printWin = window.open("", "_blank", "width=380,height=600");
  if (printWin) {
    printWin.document.write(`<html><body>${content}<script>window.onload=function(){window.print();window.close();}</script></body></html>`);
    printWin.document.close();
  }
};

export const VentaAlDia = () => {
  const { 
    products = [], 
    categories = [], 
    payDirectInvoice, 
    currentUser, 
    exchangeRate = 36.62 
  } = useBar();

  // Estados locales para la venta rápida
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashGiven, setCashGiven] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Filtrar Productos del Catálogo
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchCat = selectedCategory === 'all' || 
        String(product.category).toLowerCase() === String(selectedCategory).toLowerCase() ||
        String(product.category_id).toLowerCase() === String(selectedCategory).toLowerCase();
      
      const matchSearch = searchTerm.trim() === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim());

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // 2. Operaciones con el Carrito
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => String(item.product.id) === String(product.id));
      if (existing) {
        return prev.map(item => 
          String(item.product.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCartItems(prev => 
      prev.map(item => {
        if (String(item.product.id) === String(productId)) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems(prev => prev.filter(item => String(item.product.id) !== String(productId)));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCashGiven('');
    setTransactionId('');
    setSuccessMsg('');
  };

  // 3. Totales Financieros
  const subtotalBase = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return paymentMethod === 'Tarjeta' ? subtotalBase * 1.10 : subtotalBase;
  }, [subtotalBase, paymentMethod]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Efectivo' || !cashGiven) return 0;
    const given = Number(cashGiven) || 0;
    return Math.max(0, given - totalAmount);
  }, [paymentMethod, cashGiven, totalAmount]);

  // 4. Imprimir Comanda de Cocina/Barra
  const handlePrintComanda = () => {
    if (cartItems.length === 0) return;
    try {
      printComandaTicket({
        items: cartItems,
        customerName: 'Venta al Día',
        cashierName: currentUser?.name || 'Cajero',
      });
    } catch (err) {
      console.error('Error al imprimir comanda:', err);
    }
  };

  // 5. Cobrar y Facturar
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (paymentMethod === 'Efectivo' && cashGiven && Number(cashGiven) < totalAmount) {
      showAlert({
        title: "Monto Insuficiente",
        text: `El monto entregado (C$${Number(cashGiven).toFixed(2)}) es menor al total a pagar (C$${totalAmount.toFixed(2)}).`,
        icon: "warning"
      });
      return;
    }

    try {
      setIsProcessing(true);
      const invoiceId = await payDirectInvoice({
        items: cartItems,
        customerName: 'Venta al Día',
        paymentMethod,
        transactionId: transactionId.trim(),
      });

      // Intentar imprimir factura física
      try {
        printInvoiceTicket({
          invoiceId: invoiceId || `FAC-${Date.now()}`,
          customerName: 'Venta al Día',
          cashierName: currentUser?.name || 'Cajero',
          items: cartItems,
          total: totalAmount,
          paymentMethod,
        });
      } catch (pErr) {
        console.warn('Fallo impresión de recibo:', pErr);
      }

      setSuccessMsg(`¡Venta cobrada con éxito! Factura #${invoiceId || ''}`);
      setTimeout(() => {
        handleClearCart();
      }, 1200);
    } catch (err) {
      console.error('Error al cobrar venta directa:', err);
      showError("Error al procesar la venta", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 font-sans max-w-full">
      
      {/* Encabezado del Módulo Venta al Día */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xs">
            <CgShoppingBag  className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 m-0 tracking-tight flex items-center gap-2">
               Venta Diaria
              
            </h2>
           
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cancelar / Limpiar Carrito</span>
          </button>
        )}
      </div>

      {/* Grid Principal (2 Columnas: Catálogo e Insumos / Carrito de Venta) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sección Izquierda: Catálogo de Productos (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Buscador y Píldoras de Categorías */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar producto por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
              />
            </div>

            {/* Categorías (Píldoras) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Todas
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id || selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grilla de Tarjetas de Productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto p-1 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold">
                No se encontraron productos coincidentes.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isOutOfStock = product.stock !== null && product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className={`p-3 bg-white border-2 rounded-2xl transition-all flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'border-slate-200 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-blue-500 cursor-pointer shadow-xs hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      {/* Imagen o Ícono */}
                      <div className="w-full h-24 bg-slate-50 rounded-xl mb-2 overflow-hidden flex items-center justify-center relative border border-slate-100">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-200"
                          />
                        ) : (
                          <MdLocalOffer className="w-8 h-8 text-slate-300" />
                        )}

                        {product.stock !== null && (
                          <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isOutOfStock
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-900/80 text-emerald-400 backdrop-blur-xs'
                          }`}>
                            {isOutOfStock ? 'Agotado' : `${product.stock} disp.`}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-2 m-0 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-sm font-black text-emerald-600">
                        C${Number(product.price).toFixed(2)}
                      </span>
                      <button
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) handleAddToCart(product);
                        }}
                        className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 stroke-[3px]" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sección Derecha: Carrito y Procesamiento de Cobro (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          
          <div className="space-y-4">
            
            {/* Cabecera del Carrito */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                Detalle de Venta
              </span>
              <span className="text-xs font-bold text-slate-500">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} ítem(s)
              </span>
            </div>

            {/* Lista de Ítems Agregados */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200 rounded-xl">
                  El carrito está vacío. Haz clic en un producto del catálogo para agregarlo.
                </div>
              ) : (
                cartItems.map((item) => {
                  const subtotal = item.product.price * item.quantity;
                  return (
                    <div 
                      key={item.product.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{item.product.name}</span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          C${Number(item.product.price).toFixed(2)} c/u
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-black text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-[60px]">
                        <span className="font-black text-slate-900">C${subtotal.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selector de Forma de Pago */}
            {cartItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map((method) => {
                    const isActive = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                          isActive
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>

                {/* Campos Específicos por Método de Pago */}
                {paymentMethod === 'Efectivo' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Monto Entregado (C$):</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        className="w-28 py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-right font-extrabold text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    {cashGiven && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-600">Cambio:</span>
                        <span className="font-black text-emerald-600 text-sm">C${changeAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'Tarjeta' && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-[11px] font-semibold">
                    * Pagos con Tarjeta incluyen un recargo automático del 10%.
                  </div>
                )}

                {paymentMethod === 'Transferencia' && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="text"
                      placeholder="Código de referencia / voucher..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Resumen Total */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Total a Cobrar:</span>
                {paymentMethod === 'Tarjeta' && <span className="text-[10px] text-blue-300">(Inc. 10% Tarjeta)</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-emerald-400">
                  C${totalAmount.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  ~ ${(totalAmount / exchangeRate).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Mensaje de Éxito */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Botones de Acción Finales */}
          <div className="pt-4 border-t border-slate-200 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrintComanda}
              disabled={cartItems.length === 0}
              className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl transition-all cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Comanda</span>
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || isProcessing}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold rounded-xl transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing ? (
                <span>Facturando...</span>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Cobrar y Facturar (C${totalAmount.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
