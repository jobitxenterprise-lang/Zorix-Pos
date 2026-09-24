import React, { useRef, useState } from "react";
import { Printer, CheckCircle, X } from "lucide-react";
import { useBar } from "../../context/BarContext";

export const InvoicePreview = ({ table, items, customerName, paymentDetails, onClose }) => {
  const { currentUser, exchangeRate } = useBar();
  const printRef = useRef();
  const [hasPrinted, setHasPrinted] = useState(false);

  const baseTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const isCard = paymentDetails?.method === 'Tarjeta';
  const cardFee = isCard ? baseTotal * 0.10 : 0;
  const total = baseTotal + cardFee;
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const isFinal = !!paymentDetails;
  const invoiceNum = "FAC-" + Date.now().toString().slice(-6);

  const handlePrint = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const printContent = printRef.current ? printRef.current.innerHTML : "";
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (printWindow) {
      printWindow.document.write(
        "<html><head><title>Factura</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Courier New,monospace;font-size:11px;color:#000;background:#fff;padding:6px;width:280px;max-width:100%;margin:0 auto;}img{max-width:100%;height:auto;}</style></head><body>" +
          printContent +
          "<script>window.onload=function(){window.print();window.close();}</script></body></html>",
      );
      printWindow.document.close();
    }
    setHasPrinted(true);
  };

  const handleCloseBtn = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof onClose === "function") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden border border-slate-200 my-auto">
        <div className="bg-blue-950 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-xs">
              Factura del Cliente
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isFinal && (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Enviado a Caja
              </span>
            )}
            <button
              type="button"
              onClick={handleCloseBtn}
              title="Cerrar"
              className="p-1 rounded-lg bg-white/10 hover:bg-red-500 text-white transition-all cursor-pointer shadow-xs flex items-center justify-center"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-[#fffef7] border-b border-slate-200 max-h-[65vh] overflow-y-auto">
          <div
            ref={printRef}
            style={{
              fontFamily: "Courier New, monospace",
              fontSize: "11px",
              color: "#111",
              width: "100%",
              maxWidth: "280px",
              margin: "0 auto",
            }}
          >
            {/* LOGO PARQUE ACUÁTICO EN ENCABEZADO */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <img
                src="/logo_acuatico.png"
                alt="Parque Acuático Logo"
                style={{
                  height: "48px",
                  maxHeight: "50px",
                  margin: "0 auto 6px auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
              <div style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase" }}>
                PARQUE ACUÁTICO
              </div>
              <div style={{ fontSize: "11px", color: "#333", marginTop: "1px" }}>
                ZORIX POS - Bar & Restaurante
              </div>
              <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }}></div>
              <div style={{ fontSize: "11px" }}>Fecha: {dateStr}</div>
              <div style={{ fontSize: "11px" }}>Hora: {timeStr}</div>
            </div>

            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }}></div>

            <div style={{ marginBottom: "6px", fontSize: "11px" }}>
              <div style={{ display: "flex", justify: "space-between", marginBottom: "2px" }}>
                <span style={{ fontWeight: "bold" }}>Mesa:</span>
                <span>{table.name}</span>
              </div>
              <div style={{ display: "flex", justify: "space-between", marginBottom: "2px" }}>
                <span style={{ fontWeight: "bold" }}>Cliente:</span>
                <span>{customerName || "Cliente General"}</span>
              </div>
              <div style={{ display: "flex", justify: "space-between", marginBottom: "2px" }}>
                <span style={{ fontWeight: "bold" }}>Mesero:</span>
                <span>{table.assignedWaiterName || (currentUser?.role === 'mesero' ? currentUser?.name : 'Sin mesero')}</span>
              </div>
              <div style={{ display: "flex", justify: "space-between", marginBottom: "2px" }}>
                <span style={{ fontWeight: "bold" }}>Cajero:</span>
                <span>{currentUser?.role === 'cajero' || isFinal ? (currentUser?.name || "Cajero") : "En caja"}</span>
              </div>
              <div style={{ display: "flex", justify: "space-between" }}>
                <span style={{ fontWeight: "bold" }}>Factura N°:</span>
                <span style={{ fontSize: "11px", fontWeight: "bold" }}>{invoiceNum}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }}></div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#000000",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              <span style={{ flex: 1, paddingRight: "4px" }}>DESCRIPCION</span>
              <span style={{ width: "24px", textAlign: "center" }}>CANT</span>
              <span style={{ width: "70px", textAlign: "right" }}>TOTAL</span>
            </div>
            
            <div style={{ borderTop: "1px dashed #888", margin: "2px 0 5px" }}></div>

            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  alignItems: "flex-start",
                  fontSize: "11px",
                }}
              >
                <div style={{ flex: 1, paddingRight: "4px" }}>
                  <div style={{ fontWeight: "600" }}>{item.product.name}</div>
                  <div style={{ fontSize: "10px", color: "#555" }}>
                    C${item.product.price.toFixed(2)} c/u
                  </div>
                </div>
                <span style={{ width: "24px", textAlign: "center" }}>
                  {item.quantity}
                </span>
                <span
                  style={{
                    width: "70px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  C${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }}></div>

            {isCard && (
              <>
                <div style={{ display: "flex", justify: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                  <span>Subtotal:</span>
                  <span>C${baseTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justify: "space-between", fontSize: "11px", marginBottom: "4px", fontWeight: "bold" }}>
                  <span>Recargo 10% Tarjeta:</span>
                  <span>+C${cardFee.toFixed(2)}</span>
                </div>
              </>
            )}

            <div
              style={{
                display: "flex",
                justify: "space-between",
                fontWeight: "bold",
                fontSize: "12px",
                marginBottom: "6px",
              }}
            >
              <span>TOTAL A PAGAR:</span>
              <span>C${total.toFixed(2)}</span>
            </div>

            {/* Equivalente en Dólares */}
            <div
              style={{
                display: "flex",
                justify: "space-between",
                fontWeight: "bold",
                fontSize: "11px",
                marginBottom: "8px",
                color: "#222",
              }}
            >
              <span>Total USD (Tasa {exchangeRate}):</span>
              <span>US${(total / exchangeRate).toFixed(2)}</span>
            </div>
            
            {isFinal && paymentDetails && (
              <>
                <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }}></div>
                <div style={{ display: "flex", justify: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                  <span style={{ fontWeight: "bold" }}>Método Pago:</span>
                  <span>{paymentDetails.method}</span>
                </div>
                {paymentDetails.method === 'Efectivo' ? (
                  <>
                    <div style={{ display: "flex", justify: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                      <span style={{ fontWeight: "bold" }}>Recibido ({paymentDetails.currency}):</span>
                      <span>{paymentDetails.currency === 'NIO' ? 'C$' : 'US$'}{paymentDetails.received.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justify: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                      <span style={{ fontWeight: "bold" }}>Vuelto ({paymentDetails.currency}):</span>
                      <span>{paymentDetails.currency === 'NIO' ? 'C$' : 'US$'}{paymentDetails.change.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", justify: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                    <span style={{ fontWeight: "bold" }}>Ref/Voucher:</span>
                    <span>{paymentDetails.reference}</span>
                  </div>
                )}
              </>
            )}

            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }}></div>
            <div style={{ textAlign: "center", fontSize: "10px", color: "#555" }}>
              <div>¡Gracias por su visita!</div>
              <div style={{ marginTop: "2px" }}>
                PROPINA VOLUNTARIA
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 flex flex-col gap-2">
          {!hasPrinted ? (
            <button
              type="button"
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> Imprimir Factura
            </button>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-bold">
                <CheckCircle className="w-4 h-4" /> Factura enviada a imprimir
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-blue-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> Listo, Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
