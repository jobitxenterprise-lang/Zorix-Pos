import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 45,
    paddingHorizontal: 28,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  // Header
  headerContainer: {
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f172a',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  companySubtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  reportBadge: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reportBadgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    fontSize: 8,
    color: '#475569',
  },
  // Section Title
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // KPI Cards Grid
  kpiGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
  },
  kpiCardProfit: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  kpiValueProfit: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  // Payment Breakdown
  paymentRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  paymentValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  // Table Generic
  table: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderBottomStyle: 'solid',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderBottomStyle: 'solid',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 7.5,
    color: '#334155',
  },
  tableCellBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  // Column sizing - Products
  prodColName: { width: '38%' },
  prodColQty: { width: '10%', textAlign: 'center' },
  prodColCost: { width: '13%', textAlign: 'right' },
  prodColSale: { width: '13%', textAlign: 'right' },
  prodColProfit: { width: '14%', textAlign: 'right' },
  prodColMargin: { width: '12%', textAlign: 'right' },
  // Column sizing - Invoices
  invColId: { width: '22%' },
  invColDate: { width: '20%' },
  invColTable: { width: '18%' },
  invColWaiter: { width: '18%' },
  invColMethod: { width: '10%', textAlign: 'center' },
  invColTotal: { width: '12%', textAlign: 'right' },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    fontSize: 7.5,
    color: '#94a3b8',
  },
});

const formatMoney = (val) => {
  const num = Number(val) || 0;
  return `C$ ${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (isoString) => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const SalesReportPDF = ({ reportData, adminName = 'Administrador' }) => {
  const summary = reportData?.summary || {
    total_sales: 0,
    total_cost: 0,
    total_expenses: 0,
    net_profit: 0,
    net_margin: 0,
  };
  const payments = reportData?.payment_methods || { cash: 0, card: 0, transfer: 0, other: 0 };
  const products = reportData?.products || [];
  const invoices = reportData?.invoices || [];
  const period = reportData?.period || {};

  return (
    <Document
      title="Reporte Financiero y Balance General - Zorix POS"
      author="Sistema Zorix POS"
    >
      <Page size="A4" style={styles.page}>
        {/* Encabezado del Documento */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.companyName}>ZORIX POS</Text>
              <Text style={styles.companySubtitle}>Reporte Financiero y Balance Operativo</Text>
            </View>
            <View style={styles.reportBadge}>
              <Text style={styles.reportBadgeText}>REPORTE GENERAL</Text>
            </View>
          </View>

          <View style={styles.headerMeta}>
            <Text>
              Rango: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{formatDate(period.start_date)}</Text> hasta{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{formatDate(period.end_date)}</Text>
            </Text>
            <Text>
              Emisión: {formatDate(new Date().toISOString())} | Auditor: {adminName}
            </Text>
          </View>
        </View>

        {/* Resumen Financiero (KPIs) */}
        <Text style={styles.sectionTitle}>Resumen Financiero y Rentabilidad</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Venta Total</Text>
            <Text style={styles.kpiValue}>{formatMoney(summary.total_sales)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Costo Mercancía</Text>
            <Text style={styles.kpiValue}>{formatMoney(summary.total_cost)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Gastos Operativos</Text>
            <Text style={styles.kpiValue}>{formatMoney(summary.total_expenses)}</Text>
          </View>
          <View style={styles.kpiCardProfit}>
            <Text style={[styles.kpiLabel, { color: '#15803d' }]}>Ganancia Neta</Text>
            <Text style={styles.kpiValueProfit}>{formatMoney(summary.net_profit)}</Text>
          </View>
          <View style={styles.kpiCardProfit}>
            <Text style={[styles.kpiLabel, { color: '#15803d' }]}>Margen Neto</Text>
            <Text style={styles.kpiValueProfit}>{Number(summary.net_margin || 0).toFixed(1)}%</Text>
          </View>
        </View>

        {/* Desglose de Métodos de Pago */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Efectivo:</Text>
            <Text style={styles.paymentValue}>{formatMoney(payments.cash)}</Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Tarjeta:</Text>
            <Text style={styles.paymentValue}>{formatMoney(payments.card)}</Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Transferencia:</Text>
            <Text style={styles.paymentValue}>{formatMoney(payments.transfer)}</Text>
          </View>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Facturas Totales:</Text>
            <Text style={styles.paymentValue}>{invoices.length}</Text>
          </View>
        </View>

        {/* Tabla de Rendimiento por Producto */}
        <Text style={styles.sectionTitle}>
          Rendimiento por Producto ({products.length} ítems vendidos)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.prodColName]}>Producto</Text>
            <Text style={[styles.tableHeaderText, styles.prodColQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.prodColCost]}>Costo Tot.</Text>
            <Text style={[styles.tableHeaderText, styles.prodColSale]}>Venta Tot.</Text>
            <Text style={[styles.tableHeaderText, styles.prodColProfit]}>Ganancia</Text>
            <Text style={[styles.tableHeaderText, styles.prodColMargin]}>Margen %</Text>
          </View>
          {products.map((p, idx) => (
            <View
              key={`prod-${idx}`}
              style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              wrap={false}
            >
              <Text style={[styles.tableCellBold, styles.prodColName]}>{p.name}</Text>
              <Text style={[styles.tableCell, styles.prodColQty]}>{p.quantity}</Text>
              <Text style={[styles.tableCell, styles.prodColCost]}>{formatMoney(p.total_cost)}</Text>
              <Text style={[styles.tableCellBold, styles.prodColSale]}>{formatMoney(p.total_sales)}</Text>
              <Text
                style={[
                  styles.tableCellBold,
                  styles.prodColProfit,
                  { color: p.profit >= 0 ? '#15803d' : '#b91c1c' },
                ]}
              >
                {formatMoney(p.profit)}
              </Text>
              <Text style={[styles.tableCell, styles.prodColMargin]}>
                {Number(p.margin_pct || 0).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Tabla de Auditoría de Facturas */}
        <Text style={styles.sectionTitle}>
          Auditoría Cronológica de Facturas ({invoices.length} registradas)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.invColId]}>N° Factura</Text>
            <Text style={[styles.tableHeaderText, styles.invColDate]}>Fecha / Hora</Text>
            <Text style={[styles.tableHeaderText, styles.invColTable]}>Mesa / Barra</Text>
            <Text style={[styles.tableHeaderText, styles.invColWaiter]}>Atendido Por</Text>
            <Text style={[styles.tableHeaderText, styles.invColMethod]}>Método</Text>
            <Text style={[styles.tableHeaderText, styles.invColTotal]}>Total</Text>
          </View>
          {invoices.map((inv, idx) => (
            <View
              key={`inv-${idx}`}
              style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              wrap={false}
            >
              <Text style={[styles.tableCellBold, styles.invColId]}>{inv.id}</Text>
              <Text style={[styles.tableCell, styles.invColDate]}>{formatDate(inv.created_at)}</Text>
              <Text style={[styles.tableCell, styles.invColTable]}>{inv.table_name || 'Barra'}</Text>
              <Text style={[styles.tableCell, styles.invColWaiter]}>{inv.waiter_name || '--'}</Text>
              <Text style={[styles.tableCell, styles.invColMethod]}>{inv.payment_method}</Text>
              <Text style={[styles.tableCellBold, styles.invColTotal]}>{formatMoney(inv.total)}</Text>
            </View>
          ))}
        </View>

        {/* Pie de Página Fijo Dinámico */}
        <View
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => (
            <>
              <Text>Zorix POS • Documento Confidencial de Auditoría</Text>
              <Text>Página {pageNumber} de {totalPages}</Text>
            </>
          )}
        />
      </Page>
    </Document>
  );
};
