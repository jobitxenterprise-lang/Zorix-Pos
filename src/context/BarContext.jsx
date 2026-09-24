import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { INITIAL_PRODUCTS, INITIAL_TABLES, CATEGORIES } from "../mock/initialData";
import { 
  getOfflineQueue, 
  enqueueOfflineAction, 
  syncOfflineQueue, 
  saveOfflineSnapshot, 
  getOfflineSnapshot 
} from "../utils/offlineQueue";
import { showAlert, showError, showInputPrompt, showConfirm } from "../utils/swal";
import { sendToLocalPrinter } from "../utils/printerService";

const BarContext = createContext();
const SESSION_KEY = "bar_active_session_v1";

const imageDictionary = INITIAL_PRODUCTS.reduce((acc, p) => {
  acc[p.name] = p.image;
  return acc;
}, {});

export const BarProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState(currentUser?.role || "mesero");

  // Estados principales de la aplicación
  const initialSnapshot = typeof getOfflineSnapshot === 'function' ? getOfflineSnapshot() : null;

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [products, setProducts] = useState([]);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [cashRegisterHistory, setCashRegisterHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(36.62);
  const [currentShiftId, setCurrentShiftId] = useState(() => initialSnapshot?.currentShiftId || null);
  const [shiftStartTime, setShiftStartTime] = useState(() => initialSnapshot?.shiftStartTime || null);
  const [openingCash, setOpeningCash] = useState(() => initialSnapshot?.openingCash || 0);

  // Estados para Carga de Historial Bajo Demanda (Admin / Reportes)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Estados de Conexión y Cola Offline
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getOfflineQueue().length);

  const [isLoading, setIsLoading] = useState(true);

  // Referencias para proteger el estado en tiempo real contra Race Conditions
  const pendingSyncTablesRef = useRef(new Map());
  const updateOrderDebounceTimersRef = useRef(new Map());
  const inFlightWritesRef = useRef(new Map());
  const latestPendingWriteRef = useRef(new Map());
  const fetchSeqRef = useRef(0);
  const realtimeOrdersDebounceRef = useRef(null);

  const fetchData = async (silent = false) => {
    const mySeq = ++fetchSeqRef.current;
    try {
      if (!silent) setIsLoading(true);

      // Ejecutar consultas iniciales independientes EN PARALELO (Parallel Fetch)
      const [
        settingsRes,
        categoriesRes,
        usersRes,
        productsRes,
        bundlesRes,
        tablesRes,
        ordersRes,
        shiftsRes,
      ] = await Promise.all([
        supabase.from("settings").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("users").select("*"),
        supabase.from("products").select("*"),
        supabase.from("product_bundles").select("*"),
        supabase.from("tables").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("shifts").select("*").is("closed_at", null).order("opened_at", { ascending: false }).limit(1),
      ]);

      if (mySeq !== fetchSeqRef.current) return;

      const settingsData = settingsRes.data;
      const categoriesData = categoriesRes.data;
      const usersData = usersRes.data;
      const productsData = productsRes.data;
      const bundlesData = bundlesRes.data;
      const tablesData = tablesRes.data;
      const tablesError = tablesRes.error;
      const ordersData = ordersRes.data;
      const ordersError = ordersRes.error;
      const activeShiftsData = shiftsRes.data;

      if (tablesError) throw new Error("Fallo al obtener mesas: " + tablesError.message);
      if (ordersError) throw new Error("Fallo al obtener órdenes: " + ordersError.message);

      // 1. Configs Globales
      if (settingsData) {
        const rate = settingsData.find((s) => s.key === "exchange_rate");
        if (rate) setExchangeRate(rate.value);
      }

      // 2. Categorías
      if (categoriesData && categoriesData.length > 0) {
        setCategories(
          categoriesData.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || "MdLocalOffer",
          }))
        );
      }

      // 3. Usuarios
      if (usersData) {
        setUsers(
          usersData.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            password: u.password_hash,
            role: u.role,
            active: u.is_active,
          })),
        );
      }

      // 4. Productos
      let mappedProducts = [];
      let newTables = [];
      let currentShiftInvoices = [];

      if (productsData) {
        mappedProducts = productsData.map((p) => {
          const bundleItems = bundlesData
            ?.filter((b) => b.promotion_id === p.id)
            .map((b) => ({
              productId: b.base_product_id,
              quantity: b.quantity_to_deduct,
            }));
          return {
            id: p.id,
            name: p.name,
            category: p.category_id,
            price: Number(p.price),
            cost: Number(p.cost),
            stock: null,
            print_type: p.print_type || (p.category_id === 'comida' ? '3' : '2'),
            image:
              p.icon_path && p.icon_path.startsWith("http")
                ? p.icon_path
                : imageDictionary[p.name] || "",
            bundleItems: bundleItems?.length > 0 ? bundleItems : undefined,
          };
        });
        setProducts(mappedProducts);
      }

      // 5. Mesas y Órdenes
      if (tablesData && productsData) {
        const resolveTableItems = (tableId, dbTable, tableOrders) => {
          const sId = String(tableId);
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          const shieldDuration = isOffline ? 300000 : 2000;

          const pending = pendingSyncTablesRef.current.get(sId);
          const hasPendingActive =
            pending &&
            !pending.isDeleted &&
            (inFlightWritesRef.current.has(sId) || Date.now() - pending.timestamp < shieldDuration);

          const dbItemsMap = new Map();
          const dbUnprintedMap = new Map();

          tableOrders.forEach((order) => {
            const rawProd =
              productsData.find((p) => String(p.id) === String(order.product_id)) ||
              (INITIAL_PRODUCTS || []).find(
                (p) => String(p.id) === String(order.product_id),
              );

            const product = rawProd
              ? {
                  id: rawProd.id,
                  name: rawProd.name,
                  category: rawProd.category_id || rawProd.category,
                  price: Number(rawProd.price),
                  cost: Number(rawProd.cost || 0),
                  stock: null,
                  image:
                    rawProd.icon_path && rawProd.icon_path.startsWith("http")
                      ? rawProd.icon_path
                      : imageDictionary[rawProd.name] || "",
                }
              : {
                  id: order.product_id,
                  name: "Producto",
                  category: "general",
                  price: 0,
                  cost: 0,
                  stock: null,
                  image: "",
                };

            const sProdId = String(product.id);
            const qty = Number(order.quantity) || 1;

            if (dbItemsMap.has(sProdId)) {
              dbItemsMap.get(sProdId).quantity += qty;
            } else {
              dbItemsMap.set(sProdId, { product, quantity: qty });
            }

            if (!order.is_printed) {
              if (dbUnprintedMap.has(sProdId)) {
                dbUnprintedMap.get(sProdId).quantity += qty;
              } else {
                dbUnprintedMap.set(sProdId, { product, quantity: qty });
              }
            }
          });

          if (!hasPendingActive) {
            return {
              status: dbTable.status || "libre",
              customerName: dbTable.customer_name || "",
              items: Array.from(dbItemsMap.values()),
              unprintedItems: Array.from(dbUnprintedMap.values()),
            };
          }

          return {
            status: pending.status || dbTable.status || "ocupada",
            customerName: pending.customerName !== undefined ? pending.customerName : dbTable.customer_name || "",
            items: pending.items || [],
            unprintedItems: pending.unprintedItems || [],
          };
        };

        newTables = [];
        for (const dbTable of tablesData) {
          const sId = String(dbTable.id);
          const pending = pendingSyncTablesRef.current.get(sId);
          if (pending && pending.isDeleted) {
            continue;
          }

          const tableOrders =
            ordersData?.filter(
              (o) => String(o.table_id) === sId,
            ) || [];

          const resolved = resolveTableItems(sId, dbTable, tableOrders);

          if (resolved.status === "libre" && resolved.items.length === 0 && !pending) {
            continue;
          }

          newTables.push({
            id: sId,
            name: dbTable.name || (dbTable.is_bar_account ? "Barra" : `Mesa ${sId}`),
            area: dbTable.area || "Rancho principal",
            status: resolved.status,
            customerName: resolved.customerName,
            assignedWaiterId: dbTable.assigned_waiter_id,
            assignedWaiterName: usersData?.find(u => u.id === dbTable.assigned_waiter_id)?.name,
            createdAt: dbTable.created_at,
            isBar: Boolean(dbTable.is_bar_account),
            orderVersion: Number(dbTable.order_version || 0),
            items: resolved.items,
            unprintedItems: resolved.unprintedItems,
          });
        }

        for (const [pId, pData] of pendingSyncTablesRef.current.entries()) {
          if (!pData.isDeleted && !newTables.some((t) => String(t.id) === String(pId))) {
            newTables.push({
              id: pId,
              name: pData.name || (pId.startsWith("barra_") ? "Barra" : `Mesa ${pId}`),
              area: pData.area || "Rancho principal",
              status: pData.status || "ocupada",
              customerName: pData.customerName || "",
              assignedWaiterId: currentUser?.id,
              assignedWaiterName: currentUser?.name,
              createdAt: new Date().toISOString(),
              isBar: pId.startsWith("barra_"),
              orderVersion: pData.orderVersion || 0,
              items: pData.items || [],
              unprintedItems: pData.unprintedItems || [],
            });
          }
        }

        newTables.sort((a, b) => {
          if (a.isBar && !b.isBar) return 1;
          if (!a.isBar && b.isBar) return -1;
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });

        if (mySeq === fetchSeqRef.current) {
          setTables(newTables);
        }
      }

      // 6. ACTUALIZAR ESTADO DEL TURNO ACTIVO INMEDIATAMENTE
      let activeShift = activeShiftsData && activeShiftsData.length > 0 ? activeShiftsData[0] : null;

      if (activeShift) {
        setCurrentShiftId(activeShift.id);
        setShiftStartTime(activeShift.opened_at);
        setOpeningCash(Number(activeShift.opening_cash || 0));
      } else {
        setCurrentShiftId(null);
        setShiftStartTime(null);
        setOpeningCash(0);
        setPaidInvoices([]);
      }

      // 7. Cargar Facturas y Gastos del turno activo en paralelo
      let expensesQuery = supabase.from("expenses").select("*");
      if (activeShift) {
        expensesQuery = expensesQuery.or(`shift_id.eq.${activeShift.id},shift_id.is.null`);
      } else {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        expensesQuery = expensesQuery.gte("created_at", since24h);
      }

      let invoicesQuery = activeShift
        ? supabase.from("invoices").select("*").eq("shift_id", activeShift.id)
        : Promise.resolve({ data: [] });

      const [{ data: invData }, { data: expensesData }] = await Promise.all([
        invoicesQuery,
        expensesQuery,
      ]);

      if (mySeq !== fetchSeqRef.current) return;

      if (activeShift && invData && invData.length > 0) {
        const invIds = invData.map((inv) => inv.id);
        const { data: invItemsData } = await supabase
          .from("invoice_items")
          .select("*")
          .in("invoice_id", invIds);

        if (mySeq !== fetchSeqRef.current) return;
        const activeShiftItems = invItemsData || [];

        currentShiftInvoices = (invData || []).map((inv) => ({
          id: inv.id,
          shiftId: inv.shift_id,
          tableName: inv.table_name,
          customerName: inv.customer_name,
          waiterName: inv.waiter_name,
          total: Number(inv.total),
          paymentMethod: inv.payment_method,
          transactionId: inv.transaction_id,
          fullDate: inv.created_at,
          date: new Date(inv.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          items: activeShiftItems
            .filter((it) => it.invoice_id === inv.id)
            .map((it) => ({
              name: it.product_name,
              quantity: it.quantity,
              price: Number(it.price_at_sale),
              cost: Number(it.cost_at_sale || 0),
            })),
        }));

        setPaidInvoices(currentShiftInvoices);
      }

      if (expensesData) {
        setExpenses(
          expensesData.map((e) => ({
            id: e.id,
            shiftId: e.shift_id,
            amount: Number(e.amount) || 0,
            description: e.description || "",
            category: e.category || "otros",
            isPaid: e.is_paid !== false,
            paymentMethod: "Efectivo",
            notificationDate: e.notification_date || null,
            date: e.created_at || e.date || new Date().toISOString(),
          })),
        );
      }

      // Guardar snapshot para uso offline (incluyendo turno activo)
      saveOfflineSnapshot({
        currentShiftId: activeShift ? activeShift.id : null,
        shiftStartTime: activeShift ? activeShift.opened_at : null,
        openingCash: activeShift ? Number(activeShift.opening_cash || 0) : 0,
        products: mappedProducts,
        tables: newTables,
        categories: categoriesData || CATEGORIES,
        users: usersData || [],
        paidInvoices: currentShiftInvoices,
        cashRegisterHistory: cashRegisterHistory,
        expenses: expensesData ? expensesData.map(e => ({
          id: e.id,
          shiftId: e.shift_id,
          amount: Number(e.amount) || 0,
          description: e.description || "",
          category: e.category || "otros",
          isPaid: e.is_paid !== false,
          paymentMethod: "Efectivo",
          notificationDate: e.notification_date || null,
          date: e.created_at || e.date || new Date().toISOString(),
        })) : [],
      });

    } catch (err) {
      console.error("Error al cargar datos desde Supabase:", err);
      if (!navigator.onLine) {
        const snapshot = getOfflineSnapshot();
        if (snapshot) {
          if (snapshot.currentShiftId !== undefined) setCurrentShiftId(snapshot.currentShiftId);
          if (snapshot.shiftStartTime !== undefined) setShiftStartTime(snapshot.shiftStartTime);
          if (snapshot.openingCash !== undefined) setOpeningCash(snapshot.openingCash);
          if (snapshot.products) setProducts(snapshot.products);
          if (snapshot.tables) setTables(snapshot.tables);
          if (snapshot.categories) setCategories(snapshot.categories);
          if (snapshot.users) setUsers(snapshot.users);
          if (snapshot.paidInvoices) setPaidInvoices(snapshot.paidInvoices);
          if (snapshot.cashRegisterHistory) setCashRegisterHistory(snapshot.cashRegisterHistory);
          if (snapshot.expenses) setExpenses(snapshot.expenses);
        }
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Sincronización en Tiempo Real
  useEffect(() => {
    fetchData();

    const handleOnline = async () => {
      setIsOnline(true);
      const result = await syncOfflineQueue(supabase, () => {
        setPendingSyncCount(getOfflineQueue().length);
        fetchData(true);
      });
      setPendingSyncCount(result.remaining);
    };

    const handleOffline = () => setIsOnline(false);

    const handleFocus = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        if (inFlightWritesRef.current.size === 0) {
          fetchData(true);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);

    const channel = supabase
      .channel("pos-realtime-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const delId = String(payload.old.id);
            setTables((prev) => prev.filter((t) => String(t.id) !== delId));
            return;
          }

          const raw = payload.new;
          if (!raw) return;
          const sId = String(raw.id);

          const pending = pendingSyncTablesRef.current.get(sId);
          // SI LA MESA FUE ELIMINADA O SU ESTADO ES LIBRE, IGNORAR Y DESCHARTAR DE PANTALLA
          if (pending?.isDeleted || raw.status === "libre") {
            setTables((prev) => prev.filter((t) => String(t.id) !== sId));
            return;
          }

          if (pending && !pending.isDeleted && (inFlightWritesRef.current.has(sId) || Date.now() - pending.timestamp < 3000)) {
            return;
          }

          setTables((prev) => {
            const exists = prev.some((t) => String(t.id) === sId);
            if (exists) {
              return prev.map((t) =>
                String(t.id) === sId
                  ? {
                      ...t,
                      name: raw.name || t.name,
                      status: raw.status || t.status,
                      customerName: raw.customer_name !== undefined ? raw.customer_name : t.customerName,
                      orderVersion: Number(raw.order_version || t.orderVersion),
                    }
                  : t
              );
            }
            return [
              ...prev,
              {
                id: sId,
                name: raw.name || (raw.is_bar_account ? "Barra" : `Mesa ${sId}`),
                status: raw.status || "ocupada",
                customerName: raw.customer_name || "",
                assignedWaiterId: raw.assigned_waiter_id,
                assignedWaiterName: users.find((u) => u.id === raw.assigned_waiter_id)?.name,
                createdAt: raw.created_at,
                isBar: Boolean(raw.is_bar_account),
                orderVersion: Number(raw.order_version || 0),
                items: [],
                unprintedItems: [],
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          if (realtimeOrdersDebounceRef.current) {
            clearTimeout(realtimeOrdersDebounceRef.current);
          }
          realtimeOrdersDebounceRef.current = setTimeout(() => {
            fetchData(true);
          }, 1800);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        () => {
          fetchData(true);
        }
      )
      .subscribe();

    return () => {
      if (realtimeOrdersDebounceRef.current) {
        clearTimeout(realtimeOrdersDebounceRef.current);
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  // Carga de Historial de Turnos, Facturas y Gastos Bajo Demanda (Admin / Reportes)
  const loadShiftHistory = useCallback(async (force = false) => {
    if (historyLoaded && !force) return;
    setIsHistoryLoading(true);

    try {
      // 1. Obtener los turnos cerrados (últimos 60)
      const { data: closedShifts, error: shiftsErr } = await supabase
        .from("shifts")
        .select("*")
        .not("closed_at", "is", null)
        .order("closed_at", { ascending: false })
        .limit(60);

      if (shiftsErr) throw shiftsErr;

      if (!closedShifts || closedShifts.length === 0) {
        setCashRegisterHistory([]);
        setHistoryLoaded(true);
        return;
      }

      const closedShiftIds = closedShifts.map((s) => s.id);

      // 2. Traer facturas de esos turnos específicos
      const { data: histInvoices, error: invErr } = await supabase
        .from("invoices")
        .select("*")
        .in("shift_id", closedShiftIds);

      if (invErr) throw invErr;

      let histInvItems = [];
      if (histInvoices && histInvoices.length > 0) {
        const histInvIds = histInvoices.map((i) => i.id);
        const CHUNK_SIZE = 80;
        for (let i = 0; i < histInvIds.length; i += CHUNK_SIZE) {
          const chunk = histInvIds.slice(i, i + CHUNK_SIZE);
          const { data: itemsChunk } = await supabase
            .from("invoice_items")
            .select("*")
            .in("invoice_id", chunk);
          if (itemsChunk) {
            histInvItems.push(...itemsChunk);
          }
        }
      }

      // 3. Traer gastos históricos correspondientes a esos turnos
      const { data: histExpenses } = await supabase
        .from("expenses")
        .select("*")
        .in("shift_id", closedShiftIds);

      if (histExpenses && histExpenses.length > 0) {
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newFormatted = histExpenses
            .filter((e) => !existingIds.has(e.id))
            .map((e) => ({
              id: e.id,
              shiftId: e.shift_id,
              amount: Number(e.amount) || 0,
              description: e.description || "",
              category: e.category || "otros",
              isPaid: e.is_paid !== false,
              notificationDate: e.notification_date || null,
              date: e.created_at || e.date || new Date().toISOString(),
            }));
          return [...prev, ...newFormatted];
        });
      }

      // 4. Mapear facturas con sus productos vendidos
      const mappedInvoices = (histInvoices || []).map((inv) => ({
        id: inv.id,
        shiftId: inv.shift_id,
        tableName: inv.table_name,
        customerName: inv.customer_name,
        waiterName: inv.waiter_name,
        cashierName: inv.cashier_name,
        total: Number(inv.total),
        paymentMethod: inv.payment_method,
        transactionId: inv.transaction_id,
        fullDate: inv.created_at,
        date: new Date(inv.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: histInvItems
          .filter((it) => it.invoice_id === inv.id)
          .map((it) => ({
            name: it.product_name,
            quantity: it.quantity,
            price: Number(it.price_at_sale),
            cost: Number(it.cost_at_sale || 0),
          })),
      }));

      // 5. Construir historial de cortes estructurado
      const calculatedHistory = closedShifts.map((shift) => {
        const shiftInvoices = mappedInvoices.filter((inv) => inv.shiftId === shift.id);
        const totalSales = shift.total_real !== null && shift.total_real !== undefined
          ? Number(shift.total_real)
          : shiftInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalCash = shiftInvoices
          .filter((inv) => inv.paymentMethod === "Efectivo")
          .reduce((sum, inv) => sum + inv.total, 0);
        const totalCard = shiftInvoices
          .filter((inv) => inv.paymentMethod !== "Efectivo")
          .reduce((sum, inv) => sum + inv.total, 0);

        const cashier = users.find((u) => u.id === shift.opened_by);

        return {
          id: shift.id,
          startTime: shift.opened_at,
          endTime: shift.closed_at,
          openTime: shift.opened_at,
          closeTime: shift.closed_at,
          totalSales,
          totalCash,
          totalCard,
          cashierName: cashier ? cashier.name : "Cajero",
          invoices: shiftInvoices,
        };
      });

      calculatedHistory.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
      setCashRegisterHistory(calculatedHistory);
      setHistoryLoaded(true);
    } catch (err) {
      console.error("Error al cargar historial bajo demanda:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historyLoaded, users]);

  // Si el usuario cambia o inicia con rol Admin, cargar historial si no está cargado
  useEffect(() => {
    if (currentRole === "admin" && !historyLoaded && !isHistoryLoading) {
      loadShiftHistory();
    }
  }, [currentRole, historyLoaded, isHistoryLoading, loadShiftHistory]);

  // Función auxiliar de purga limpia de timers por mesa
  const purgeTableTimersAndWrites = (sTableId) => {
    if (updateOrderDebounceTimersRef.current.has(sTableId)) {
      clearTimeout(updateOrderDebounceTimersRef.current.get(sTableId));
      updateOrderDebounceTimersRef.current.delete(sTableId);
    }
    latestPendingWriteRef.current.delete(sTableId);
    inFlightWritesRef.current.delete(sTableId);
  };

  // Función serializada que ejecuta la escritura a Supabase de forma atómica y ordenada
  const performTableWrite = async (sTableId) => {
    // ABORT GUARD: Si la mesa fue cobrada o eliminada localmente, abortar la escritura inmediatamente
    const pendingShield = pendingSyncTablesRef.current.get(sTableId);
    if (pendingShield?.isDeleted) {
      purgeTableTimersAndWrites(sTableId);
      return;
    }

    const dataToWrite = latestPendingWriteRef.current.get(sTableId);
    if (!dataToWrite) return;

    // Consumir el pending actual
    latestPendingWriteRef.current.delete(sTableId);

    const writePromise = (async () => {
      const {
        effectiveName,
        tableStatus,
        customerName,
        isBar,
        items,
        unprintedItems,
        targetTable,
        orderVersion,
        writeId,
        actionId: providedActionId,
        reason: providedReason,
      } = dataToWrite;

      try {
        if (!navigator.onLine) {
          throw new Error("Sin conexión a internet (detectado localmente)");
        }

        const orderItems = items.map((item) => ({
          product_id: String(item.product.id),
          quantity: item.quantity,
          is_printed: unprintedItems
            ? !unprintedItems.some(
                (unprinted) => String(unprinted.product.id) === String(item.product.id),
              )
            : true,
        }));
        const actionId = providedActionId || ("act_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9));
        const effectiveReason = providedReason || "Modificación de comanda";
        const { data, error } = await supabase.rpc("save_table_order_audited", {
          p_table_id: sTableId,
          p_expected_version: orderVersion,
          p_table: {
            name: effectiveName,
            area: targetTable?.area || "Rancho principal",
            status: tableStatus || targetTable?.status || "ocupada",
            customer_name: customerName || "",
            assigned_waiter_id: targetTable?.assignedWaiterId || currentUser?.id || "",
            created_at: targetTable?.createdAt || new Date().toISOString(),
            is_bar_account: Boolean(isBar),
          },
          p_items: orderItems,
          p_user_id: currentUser?.id,
          p_action_id: actionId,
          p_reason: effectiveReason,
        });
        if (error) throw error;

        const confirmedVersion = Number(data?.order_version ?? orderVersion + 1);
        // A queued local edit must use the version that this transaction just created.
        const nextWrite = latestPendingWriteRef.current.get(sTableId);
        if (nextWrite) nextWrite.orderVersion = confirmedVersion;

        // Do not clear a newer local edit that arrived while this request ran.
        if (pendingSyncTablesRef.current.get(sTableId)?.writeId === writeId) {
          pendingSyncTablesRef.current.delete(sTableId);
        } else if (pendingSyncTablesRef.current.has(sTableId)) {
          pendingSyncTablesRef.current.get(sTableId).orderVersion = confirmedVersion;
        }
        setTables((prev) => prev.map((table) =>
          String(table.id) === sTableId
            ? { ...table, orderVersion: confirmedVersion }
            : table,
        ));
      } catch (dbErr) {
        // En cualquier caso de error, cancelar cualquier debounce pendiente para esta mesa
        if (updateOrderDebounceTimersRef.current.has(sTableId)) {
          clearTimeout(updateOrderDebounceTimersRef.current.get(sTableId));
          updateOrderDebounceTimersRef.current.delete(sTableId);
        }

        if (dbErr?.code === "40001" || String(dbErr?.message).includes("TABLE_ORDER_CONFLICT")) {
          // Another device saved this table first. Discard stale pending write to prevent retry loop.
          pendingSyncTablesRef.current.delete(sTableId);
          latestPendingWriteRef.current.delete(sTableId);
          console.warn("Conflicto de versión en mesa", sTableId);
          showAlert({ title: "Conflicto de Versión", text: "Esta cuenta fue modificada desde otro dispositivo o reiniciada. Se cargará la versión más reciente antes de continuar.", icon: "warning" });
          fetchData(true);
          return;
        }

        if (!navigator.onLine) {
          console.warn("Sin conexión a internet (encolando offline):", dbErr.message || dbErr);
          enqueueOfflineAction("UPDATE_ORDER", {
            tableId: sTableId,
            tableName: effectiveName,
            items,
            unprintedItems,
            isBar,
            customerName,
            waiterId: currentUser?.id,
            createdAt: targetTable?.createdAt || new Date().toISOString(),
            expectedVersion: orderVersion,
            userId: currentUser?.id,
            actionId: providedActionId || ("act_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)),
            reason: providedReason || "Modificación de comanda",
          });
          setPendingSyncCount(getOfflineQueue().length);
          return;
        }

        // A server/configuration error must be visible; queuing it would replay an unsafe write forever.
        pendingSyncTablesRef.current.delete(sTableId);
        latestPendingWriteRef.current.delete(sTableId);
        console.error("No se pudo guardar el pedido de forma segura:", dbErr);
        fetchData(true);
      }
    })();

    inFlightWritesRef.current.set(sTableId, writePromise);

    try {
      await writePromise;
    } finally {
      inFlightWritesRef.current.delete(sTableId);
      // Si mientras corríamos llegó una nueva versión pendiente, procesarla de inmediato
      if (latestPendingWriteRef.current.has(sTableId)) {
        performTableWrite(sTableId);
      }
    }
  };

  const updateTableOrder = async (
    tableId,
    items,
    customerName = "",
    unprintedItems = null,
    tableName = null,
  ) => {
    if (!currentShiftId) {
      showAlert({ 
        title: "Caja Cerrada", 
        text: "No hay un turno de caja abierto en este momento. Solicita al cajero realizar la apertura de caja para poder registrar o modificar pedidos.", 
        icon: "warning" 
      });
      return;
    }
    try {
      const sTableId = String(tableId);
      const targetTable = tables.find((t) => String(t.id) === sTableId);

      // GUARDIA DE SEGURIDAD POR ROL: El rol Mesero no puede eliminar productos ni disminuir cantidades
      const isMesero = currentRole === "mesero" || currentUser?.role === "mesero";
      if (isMesero && targetTable?.items && targetTable.items.length > 0) {
        for (const origItem of targetTable.items) {
          const origProdId = String(origItem.product?.id || origItem.product);
          const newItem = items.find(
            (i) => String(i.product?.id || i.product) === origProdId
          );
          if (!newItem || newItem.quantity < origItem.quantity) {
            showAlert({ title: "Acción no permitida", text: "No tienes permiso para anular productos ni disminuir cantidades. Esta acción requiere autorización de un Cajero o Administrador.", icon: "error" });
            return;
          }
        }
      }

      const tableStatus = targetTable?.status === "pendiente_pago" ? "pendiente_pago" : "ocupada";
      const effectiveName = tableName || targetTable?.name || `Mesa ${sTableId}`;
      const isBar = Boolean(targetTable?.isBar);
      const orderVersion = Number(targetTable?.orderVersion || 0);
      const writeId = `write_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // 1. Record in-flight pending state immediately to protect against background overwrites
      pendingSyncTablesRef.current.set(sTableId, {
        name: effectiveName,
        items,
        unprintedItems: unprintedItems || [],
        customerName,
        status: tableStatus,
        orderVersion,
        writeId,
        timestamp: Date.now(),
      });

      // 2. Guardar la versión más reciente en la cola de escritura serializada
      latestPendingWriteRef.current.set(sTableId, {
        effectiveName,
        tableStatus,
        customerName,
        isBar,
        items,
        unprintedItems,
        targetTable,
        orderVersion,
        writeId,
      });

      // 3. OPTIMISTIC UI UPDATE
      setTables((prevTables) =>
        prevTables.map((t) => {
          if (String(t.id) === sTableId) {
            return {
              ...t,
              name: effectiveName,
              status: tableStatus,
              customerName: customerName,
              assignedWaiterId: t.assignedWaiterId || currentUser?.id,
              assignedWaiterName: t.assignedWaiterName || currentUser?.name,
              items: items,
              unprintedItems: unprintedItems || [],
              orderVersion,
            };
          }
          return t;
        }),
      );

      // 4. Debounced write to Supabase (200ms)
      if (updateOrderDebounceTimersRef.current.has(sTableId)) {
        clearTimeout(updateOrderDebounceTimersRef.current.get(sTableId));
      }

      const timerId = setTimeout(() => {
        // Solo disparar si no hay una escritura en curso para esta mesa
        if (!inFlightWritesRef.current.has(sTableId)) {
          performTableWrite(sTableId);
        }
      }, 200);

      updateOrderDebounceTimersRef.current.set(sTableId, timerId);

      // 5. Enviar comanda a impresoras térmicas locales si hay ítems nuevos por imprimir
      const itemsToPrint = unprintedItems ? unprintedItems.filter((i) => i.quantity > 0) : [];
      if (itemsToPrint.length > 0) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const printPayload = {
          job_id: jobId,
          job_type: 'ORDER',
          table: { id: sTableId, name: effectiveName },
          waiter: { name: currentUser?.name || 'Mesero' },
          items: itemsToPrint.map((item) => {
            const prod = item.product || item;
            let printId = 1;
            if (prod.print_type) {
              printId = Number(prod.print_type);
            } else if (prod.print_id) {
              printId = Number(prod.print_id);
            } else if (prod.category === 'comida' || prod.category_id === 'comida') {
              printId = 3; // Epson TM-U220 (Comida / Caja)
            } else if (prod.category === 'bebida' || prod.category_id === 'bebida') {
              printId = 1; // POS-80C
            }
            return {
              name: prod.name || item.name || 'Producto',
              quantity: item.quantity || 1,
              price: Number(prod.price || item.price || 0),
              print_id: printId,
            };
          }),
        };
        sendToLocalPrinter(printPayload);
      }
    } catch (err) {
      console.error("updateTableOrder crash:", err);
    }
  };

  const clearUnprintedItems = async (tableId) => {
    try {
      const sTableId = String(tableId);
      const table = tables.find((item) => String(item.id) === sTableId);
      if (!table) return;
      
      const currentShield = pendingSyncTablesRef.current.get(sTableId);
      if (currentShield) {
        pendingSyncTablesRef.current.set(sTableId, {
          ...currentShield,
          unprintedItems: [],
          timestamp: Date.now(),
        });
      }

      // OPTIMISTIC UI UPDATE
      setTables((prevTables) =>
        prevTables.map((t) => {
          if (String(t.id) === sTableId) {
            return { ...t, unprintedItems: [] };
          }
          return t;
        }),
      );
      // Printing changes the order snapshot too; save it through the same
      // versioned transaction instead of issuing an independent row update.
      updateTableOrder(sTableId, table.items, table.customerName, [], table.name);
    } catch (err) {
      console.error("Error clearing unprinted items:", err);
    }
  };

  const addBarAccount = async (customerName) => {
    if (!currentShiftId) {
      showAlert({ 
        title: "Caja Cerrada", 
        text: "No hay un turno de caja abierto en este momento. Solicita al cajero realizar la apertura de caja para poder aperturar cuentas en barra.", 
        icon: "warning" 
      });
      return null;
    }
    if (currentRole === "cajero" || currentUser?.role === "cajero") {
      showAlert({ title: "Permiso denegado", text: "El rol Cajero no tiene permiso para abrir cuentas en barra.", icon: "error" });
      return null;
    }
    try {
      const newBarId = `barra_${Date.now()}`;
      const clientName = customerName && customerName.trim() ? customerName.trim() : "Cliente Barra";

      pendingSyncTablesRef.current.set(newBarId, {
        name: "Barra",
        items: [],
        unprintedItems: [],
        customerName: clientName,
        status: "ocupada",
        orderVersion: 0,
        timestamp: Date.now(),
      });

      // OPTIMISTIC UI UPDATE
      setTables((prev) => [
        ...prev,
        {
          id: newBarId,
          name: "Barra",
          status: "ocupada",
          customerName: clientName,
          assignedWaiterId: currentUser?.id,
          assignedWaiterName: currentUser?.name,
          createdAt: new Date().toISOString(),
          isBar: true,
          orderVersion: 0,
          items: [],
          unprintedItems: [],
        },
      ]);

      const { error } = await supabase.from("tables").insert({
        id: newBarId,
        name: "Barra",
        status: "ocupada",
        is_bar_account: true,
        customer_name: clientName,
        assigned_waiter_id: currentUser?.id,
        created_at: new Date().toISOString(),
      });
      if (error) {
        if (!navigator.onLine || error.message?.includes("Failed to fetch")) {
          console.warn("📵 Creación de cuenta barra en modo offline. Se sincronizará al agregar productos.");
        } else {
          console.error("Error creating bar account:", error);
          showError("Error creando cuenta en barra", error.message);
        }
      }
      return newBarId;
    } catch (err) {
      if (!navigator.onLine || err.message?.includes("Failed to fetch")) {
        console.warn("📵 Crash offline ignorado al crear barra.");
      } else {
        showError("Crash al crear cuenta en barra", err.message);
      }
    }
  };

  // Función para abrir una mesa con número de mesa, cliente y zona/área dinámicos
  const openTable = async ({ tableNumber, customerName, area = "Rancho principal" }) => {
    if (!currentShiftId) {
      showAlert({ 
        title: "Caja Cerrada", 
        text: "No hay un turno de caja abierto en este momento. Solicita al cajero realizar la apertura de caja para poder abrir mesas.", 
        icon: "warning" 
      });
      return null;
    }
    if (currentRole === "cajero" || currentUser?.role === "cajero") {
      showAlert({ title: "Permiso denegado", text: "El rol Cajero no tiene permiso para abrir nuevas mesas.", icon: "error" });
      return null;
    }
    try {
      const cleanInput = String(tableNumber || '').trim();
      const tableName = cleanInput.toLowerCase().startsWith('mesa') || isNaN(cleanInput)
        ? cleanInput
        : `Mesa ${cleanInput}`;
      
      const newTableId = `mesa_${Date.now()}`;
      const clientName = customerName ? customerName.trim() : "";
      const selectedArea = area || "Rancho principal";

      pendingSyncTablesRef.current.set(newTableId, {
        name: tableName || "Mesa",
        area: selectedArea,
        items: [],
        unprintedItems: [],
        customerName: clientName,
        status: "ocupada",
        orderVersion: 0,
        timestamp: Date.now(),
      });

      const newTableObj = {
        id: newTableId,
        name: tableName || "Mesa",
        area: selectedArea,
        status: "ocupada",
        customerName: clientName,
        assignedWaiterId: currentUser?.id,
        assignedWaiterName: currentUser?.name,
        createdAt: new Date().toISOString(),
        isBar: false,
        orderVersion: 0,
        items: [],
        unprintedItems: [],
      };

      // OPTIMISTIC UI UPDATE
      setTables((prev) => [...prev, newTableObj]);

      const { error } = await supabase.from("tables").insert({
        id: newTableId,
        name: tableName || "Mesa",
        area: selectedArea,
        status: "ocupada",
        is_bar_account: false,
        customer_name: clientName,
        assigned_waiter_id: currentUser?.id,
        created_at: new Date().toISOString(),
      });

      if (error) {
        if (!navigator.onLine || error.message?.includes("Failed to fetch")) {
          console.warn("📵 Creación de mesa offline. Se sincronizará al agregar productos.");
        } else {
          console.error("Error creating table in Supabase:", error);
        }
      }
      return newTableId;
    } catch (err) {
      console.error("Crash al abrir mesa:", err);
      return null;
    }
  };

  const addNewTable = async () => {
    if (currentRole === "cajero" || currentUser?.role === "cajero") {
      showAlert({ title: "Permiso denegado", text: "El rol Cajero no tiene permiso para abrir nuevas mesas.", icon: "error" });
      return null;
    }
    // Compatibilidad: abre una mesa solicitando los datos
    const num = await showInputPrompt({ title: "Nueva Mesa", text: "Ingresa el número de mesa:", required: true });
    if (!num) return null;
    const client = (await showInputPrompt({ title: "Nombre del Cliente", text: "Ingresa el nombre del cliente (opcional):" })) || "";
    return await openTable({ tableNumber: num, customerName: client });
  };

  const cancelTableOrder = async (tableId, reason = "Cancelación de mesa") => {
    if (!["super_cajero", "admin"].includes(currentRole) && !["super_cajero", "admin"].includes(currentUser?.role)) {
      showAlert({ 
        title: "Permiso denegado", 
        text: "El rol Cajero o Mesero no tiene permiso para cancelar mesas completas. Requiere rol Super Cajero o Administrador.", 
        icon: "error" 
      });
      return;
    }
    const sTableId = String(tableId);
    const targetTable = tables.find((t) => String(t.id) === sTableId);
    const rawItems = targetTable?.items || [];
    const formattedItems = rawItems.map((i) => ({
      product_id: i.product?.id || i.productId || i.id,
      product_name: i.product?.name || i.name || "Producto",
      quantity: Number(i.quantity) || 1,
    }));

    const actionId = "cancel_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    purgeTableTimersAndWrites(sTableId);

    // OPTIMISTIC LOCAL UPDATE
    setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));
    pendingSyncTablesRef.current.set(sTableId, {
      isDeleted: true,
      timestamp: Date.now(),
    });

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineAction('CANCEL_ORDER', { 
        tableId: sTableId,
        userId: currentUser?.id,
        actionId,
        reason,
        items: formattedItems,
      });
      setPendingSyncCount(getOfflineQueue().length);
      return;
    }

    try {
      const { error } = await supabase.rpc("cancel_table_order_audited", {
        p_table_id: sTableId,
        p_user_id: currentUser?.id,
        p_action_id: actionId,
        p_reason: reason,
        p_items: formattedItems.length > 0 ? formattedItems : null,
      });

      if (error) {
        console.error("Error al cancelar orden en Supabase:", error);
        if (error.code === '42501' || String(error.message).includes('PERMISO_DENEGADO')) {
          showAlert({ 
            title: "Permiso denegado", 
            text: "No tienes autorización para cancelar mesas completas.", 
            icon: "error" 
          });
          fetchData(true);
          return;
        }
      }
      fetchData(true);
    } catch (err) {
      console.error("Error al cancelar orden en Supabase, encolando offline:", err);
      enqueueOfflineAction('CANCEL_ORDER', { 
        tableId: sTableId,
        userId: currentUser?.id,
        actionId,
        reason,
        items: formattedItems,
      });
      setPendingSyncCount(getOfflineQueue().length);
    }
  };

  // Alias directo de compatibilidad para eliminación/cancelación de mesas
  const deleteTable = cancelTableOrder;

  const sendOrderToCashier = async (tableId, customerName) => {
    const sTableId = String(tableId);

    const currentShield = pendingSyncTablesRef.current.get(sTableId);
    if (currentShield) {
      pendingSyncTablesRef.current.set(sTableId, {
        ...currentShield,
        status: "pendiente_pago",
        customerName,
        timestamp: Date.now(),
      });
    }

    // OPTIMISTIC UI
    setTables((prev) =>
      prev.map((t) =>
        String(t.id) === sTableId
          ? { ...t, status: "pendiente_pago", customerName }
          : t,
      ),
    );

    await supabase
      .from("tables")
      .update({
        status: "pendiente_pago",
        customer_name: customerName,
      })
      .eq("id", sTableId);
  };

  const payInvoice = async (tableId, paymentMethod, transactionId = "") => {
    if (currentRole === "mesero" || currentUser?.role === "mesero") {
      showAlert({ title: "Permiso denegado", text: "El rol Mesero no tiene permiso para cobrar facturas.", icon: "error" });
      return;
    }
    if (!currentShiftId) {
      showError("Turno No Disponible", "No hay un turno de caja activo para procesar el cobro. Abre un turno de caja primero.");
      return { success: false, message: "No hay turno activo." };
    }
    const sTableId = String(tableId);
    const table = tables.find((t) => String(t.id) === sTableId);
    if (!table || !table.items || table.items.length === 0) {
      return { success: false, message: "La mesa no tiene ítems a cobrarse." };
    }

    const baseTotal = table.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const total = paymentMethod === 'Tarjeta' ? baseTotal * 1.10 : baseTotal;
    const invoiceId = `FAC-${Date.now()}`;
    const activeShiftId = currentShiftId;

    const actualWaiterName = table.assignedWaiterName || (currentUser?.role === 'mesero' ? currentUser?.name : 'Sin mesero');
    const actualCashierName = currentUser?.name || 'Cajero';

    const invoicePayload = {
      id: invoiceId,
      shift_id: activeShiftId,
      table_name: table.name,
      customer_name: table.customerName || "Cliente",
      waiter_name: actualWaiterName,
      cashier_name: actualCashierName,
      total,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      created_at: new Date().toISOString(),
    };

    const invoiceItemsPayload = table.items.map((i) => ({
      invoice_id: invoiceId,
      product_name: i.product.name,
      quantity: i.quantity,
      price_at_sale: i.product.price,
      cost_at_sale: i.product.cost || 0,
    }));

    const newLocalInvoice = {
      id: invoiceId,
      shiftId: activeShiftId,
      tableName: table.name,
      customerName: table.customerName || "Cliente",
      waiterName: actualWaiterName,
      cashierName: actualCashierName,
      total,
      paymentMethod,
      transactionId,
      fullDate: invoicePayload.created_at,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: table.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.product.price),
        cost: Number(i.product.cost || 0),
        category: i.product.category,
      })),
    };

    // Modo Sin Conexión
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn("📵 Sin conexión: Encolando cobro de factura en cola offline...");
      enqueueOfflineAction('CREATE_INVOICE', {
        invoice: invoicePayload,
        invoiceItems: invoiceItemsPayload,
        stockDeductions: [],
        tableInfo: { id: sTableId, isBar: table.isBar }
      });
      setPendingSyncCount(getOfflineQueue().length);
      purgeTableTimersAndWrites(sTableId);
      pendingSyncTablesRef.current.set(sTableId, {
        items: [],
        unprintedItems: [],
        customerName: "",
        status: "libre",
        isDeleted: true,
        timestamp: Date.now(),
      });
      setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));
      setPaidInvoices((prev) => prev.some((i) => i.id === newLocalInvoice.id) ? prev : [...prev, newLocalInvoice]);
      return { success: true, offline: true, invoiceId };
    }

    // Modo Sincrónico Confirmado con Supabase
    try {
      // 1. Insertar Factura
      const { error: invErr } = await supabase.from("invoices").insert(invoicePayload);
      if (invErr) throw invErr;

      // 2. Insertar Detalle de Factura
      const { error: itemsErr } = await supabase.from("invoice_items").insert(invoiceItemsPayload);
      if (itemsErr) throw itemsErr;

      // 3. Eliminar mesa y comandas de la BD
      await supabase.from("tables").delete().eq("id", sTableId);
      await supabase.from("orders").delete().eq("table_id", sTableId);

      // 4. Confirmación exitosa en servidor: recién aquí actualizamos el estado local
      purgeTableTimersAndWrites(sTableId);
      pendingSyncTablesRef.current.set(sTableId, {
        items: [],
        unprintedItems: [],
        customerName: "",
        status: "libre",
        isDeleted: true,
        timestamp: Date.now(),
      });
      setTables((prev) => prev.filter((t) => String(t.id) !== sTableId));
      setPaidInvoices((prev) => prev.some((i) => i.id === newLocalInvoice.id) ? prev : [...prev, newLocalInvoice]);

      fetchData(true);
      return { success: true, invoiceId };
    } catch (err) {
      console.error("Error al procesar cobro en Supabase:", err);
      showError("Error al Procesar Cobro", err?.message || "Ocurrió un error al guardar la factura en la base de datos.");
      return { success: false, error: err?.message };
    }
  };

  const payDirectInvoice = async ({
    items = [],
    customerName = "Cliente Mostrador",
    paymentMethod = "Efectivo",
    transactionId = "",
  }) => {
    if (!currentShiftId) {
      showError("Turno No Disponible", "No hay un turno de caja activo para procesar ventas directas. Abre un turno de caja primero.");
      return null;
    }
    if (!items || items.length === 0) return null;

    const baseTotal = items.reduce(
      (sum, item) => sum + (Number(item.product?.price || item.price || 0) * (Number(item.quantity) || 1)),
      0
    );
    const total = paymentMethod === 'Tarjeta' ? baseTotal * 1.10 : baseTotal;
    const invoiceId = `FAC-${Date.now()}`;
    const clientName = customerName && customerName.trim() ? customerName.trim() : "Cliente Mostrador";

    // Sin control de inventario: las ventas directas tampoco descuentan stock.
    const stockDeductions = [];

    const actualCashierName = currentUser?.name || "Cajero";

    const invoicePayload = {
      id: invoiceId,
      shift_id: currentShiftId,
      table_name: "Venta al Día",
      customer_name: clientName,
      waiter_name: "Mostrador",
      cashier_name: actualCashierName,
      total,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      created_at: new Date().toISOString(),
    };

    const invoiceItemsPayload = items.map((i) => {
      const p = i.product || i;
      return {
        invoice_id: invoiceId,
        product_name: p.name,
        quantity: Number(i.quantity) || 1,
        price_at_sale: Number(p.price) || 0,
        cost_at_sale: Number(p.cost || 0),
      };
    });

    // Agregar factura a las facturas pagadas locales
    const newLocalInvoice = {
      id: invoiceId,
      shiftId: currentShiftId,
      tableName: "Venta al Día",
      customerName: clientName,
      waiterName: "Mostrador",
      cashierName: actualCashierName,
      total,
      paymentMethod,
      transactionId,
      fullDate: invoicePayload.created_at,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: items.map((i) => {
        const p = i.product || i;
        return {
          name: p.name,
          quantity: Number(i.quantity) || 1,
          price: Number(p.price) || 0,
          cost: Number(p.cost || 0),
          category: p.category_id || p.category,
        };
      }),
    };
    setPaidInvoices((prev) => prev.some((i) => i.id === newLocalInvoice.id) ? prev : [...prev, newLocalInvoice]);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineAction('CREATE_INVOICE', {
        invoice: invoicePayload,
        invoiceItems: invoiceItemsPayload,
        stockDeductions,
        tableInfo: { id: `direct_${Date.now()}`, isBar: false }
      });
      setPendingSyncCount(getOfflineQueue().length);
      return invoiceId;
    }

    try {
      const { error: invErr } = await supabase.from("invoices").insert(invoicePayload);
      if (invErr) throw invErr;

      const { error: itemsErr } = await supabase.from("invoice_items").insert(invoiceItemsPayload);
      if (itemsErr) throw itemsErr;

      fetchData(true);
      return invoiceId;
    } catch (err) {
      console.error("Error al registrar venta directa en Supabase:", err);
      enqueueOfflineAction('CREATE_INVOICE', {
        invoice: invoicePayload,
        invoiceItems: invoiceItemsPayload,
        stockDeductions,
        tableInfo: { id: `direct_${Date.now()}`, isBar: false }
      });
      setPendingSyncCount(getOfflineQueue().length);
      return invoiceId;
    }
  };

  const openShift = async (initialCash = 0) => {
    if (!currentUser?.id) {
      showError("Usuario No Autenticado", "Debes iniciar sesión con una cuenta válida para poder abrir un turno de caja.");
      return { success: false, message: "Usuario no autenticado." };
    }

    if (currentShiftId) {
      showError("Turno Ya Activo", "Ya existe un turno de caja abierto en el sistema.");
      return { success: false, message: "Ya existe un turno de caja activo." };
    }

    const amount = Number(initialCash);
    if (isNaN(amount) || amount < 0) {
      showError("Monto Inválido", "El fondo inicial de caja debe ser un número mayor o igual a 0.");
      return { success: false, message: "Fondo inicial de caja inválido." };
    }

    try {
      const { data: createdShift, error } = await supabase
        .from("shifts")
        .insert({
          opened_by: currentUser.id,
          opening_cash: amount,
        })
        .select()
        .single();

      if (error) throw error;

      if (createdShift) {
        setCurrentShiftId(createdShift.id);
        setShiftStartTime(createdShift.opened_at);
        setOpeningCash(Number(createdShift.opening_cash || amount));
        setPaidInvoices([]);
        setExpenses([]);
        fetchData(true);
        return { success: true, shift: createdShift };
      }
    } catch (err) {
      console.error("Fallo al abrir turno de caja:", err);
      showError("Error de Apertura", err?.message || "No se pudo crear el nuevo turno de caja.");
      return { success: false, error: err };
    }
  };

  const closeShift = async ({
    cashCountDetails = null,
    totalRealCounted = null,
    notes = "",
  } = {}) => {
    if (!currentShiftId && paidInvoices.length === 0) return;
    const shiftTotal = paidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const rawCashSales = paidInvoices
      .filter((inv) => inv.paymentMethod === "Efectivo")
      .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    const shiftCashExpenses = expenses
      .filter(
        (e) =>
          e &&
          e.isPaid !== false &&
          (e.paymentMethod === "Efectivo" || !e.paymentMethod) &&
          e.shiftId &&
          String(e.shiftId) === String(currentShiftId)
      )
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalCashExpected = Number(openingCash || 0) + rawCashSales - shiftCashExpenses;

    const actualCountedCash = totalRealCounted !== null && totalRealCounted !== undefined
      ? Number(totalRealCounted)
      : totalCashExpected;

    const cashDifference = actualCountedCash - totalCashExpected;
    const closeTimestamp = new Date().toISOString();

    const updatePayload = {
      closed_at: closeTimestamp,
      closed_by: currentUser?.id || null,
      total_expected: shiftTotal,
      total_real: shiftTotal,
      total_counted_cash: actualCountedCash,
      cash_difference: cashDifference,
    };

    if (cashCountDetails) {
      updatePayload.cash_breakdown = {
        ...cashCountDetails,
        notes: notes || "",
        expectedCash: totalCashExpected,
        difference: cashDifference,
      };
    }

    try {
      // 1. Cerrar el turno actual
      if (currentShiftId) {
        const { error: closeErr } = await supabase
          .from("shifts")
          .update(updatePayload)
          .eq("id", currentShiftId);
        if (closeErr) throw closeErr;
      }

      // 2. Cerrar preventivamente cualquier otro turno huérfano que haya quedado sin cerrar
      const { error: orphanErr } = await supabase
        .from("shifts")
        .update({
          closed_at: closeTimestamp,
          closed_by: currentUser?.id || null,
          total_real: 0,
          total_expected: 0,
        })
        .is("closed_at", null);
      if (orphanErr) console.warn("Aviso al cerrar turnos huérfanos:", orphanErr);

      // 3. Reasignar cualquier factura huérfana de este corte al ID del turno cerrado
      if (currentShiftId) {
        const orphanInvoices = paidInvoices.filter((i) => !i.shiftId || i.shiftId !== currentShiftId);
        for (const inv of orphanInvoices) {
          await supabase.from("invoices").update({ shift_id: currentShiftId }).eq("id", inv.id);
        }
      }

      // 4. Dejar el sistema en estado Caja Cerrada (sin auto-apertura silenciosa)
      setCurrentShiftId(null);
      setShiftStartTime(null);
      setOpeningCash(0);
      setPaidInvoices([]);
      setExpenses([]);
      setHistoryLoaded(false); // Invalida el caché para que al ver historial incluya el nuevo corte
      await fetchData(true);
      return { success: true };
    } catch (closeErr) {
      console.error("Error al cerrar turno en Supabase:", closeErr);
      showError("Error al Cerrar Turno", closeErr?.message || "Ocurrió un error al actualizar el estado del turno en la base de datos.");
      throw closeErr;
    }
  };



  const uploadImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const addProduct = async (newProd, imageFile) => {
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const payload = {
      name: newProd.name,
      category_id: newProd.category,
      price: newProd.price,
      cost: newProd.cost,
      print_type: newProd.print_type || (newProd.category === 'comida' ? 'comida' : 'bebida'),
      stock: null,
      icon_path: imageUrl,
    };

    const { data: insertedProduct, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error inserting product:", error);
    } else if (insertedProduct && newProd.bundleItems && newProd.bundleItems.length > 0) {
      for (const bundle of newProd.bundleItems) {
        await supabase.from("product_bundles").insert({
          promotion_id: insertedProduct.id,
          base_product_id: bundle.productId,
          quantity_to_deduct: bundle.quantity,
        });
      }
    }

    fetchData();
  };

  const updateProduct = async (updatedProd, imageFile) => {
    let imageUrl = updatedProd.image; // Keep existing
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const updatePayload = {
      name: updatedProd.name,
      category_id: updatedProd.category,
      price: updatedProd.price,
      cost: updatedProd.cost,
      print_type: updatedProd.print_type || (updatedProd.category === 'comida' ? 'comida' : 'bebida'),
      stock: null,
      icon_path: imageUrl,
    };

    const { error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", updatedProd.id);

    if (error) {
      console.error("Error updating product:", error);
    } else {
      // Sincronizar product_bundles si es promocion
      await supabase.from("product_bundles").delete().eq("promotion_id", updatedProd.id);
      if (updatedProd.bundleItems && updatedProd.bundleItems.length > 0) {
        for (const bundle of updatedProd.bundleItems) {
          await supabase.from("product_bundles").insert({
            promotion_id: updatedProd.id,
            base_product_id: bundle.productId,
            quantity_to_deduct: bundle.quantity,
          });
        }
      }
    }

    fetchData();
  };

  const deleteProduct = async (productId) => {
    await supabase.from("products").delete().eq("id", productId);
    fetchData();
  };

  const updateStock = async () => {
    // El POS no controla existencias; se conserva la API para compatibilidad.
  };

  const addUser = async (newUser) => {
    await supabase.from("users").insert({
      name: newUser.name,
      username: newUser.username,
      password_hash: newUser.password || "1234",
      role: newUser.role,
      is_active: true,
    });
    fetchData();
  };

  const updateUser = async (updatedUser) => {
    await supabase
      .from("users")
      .update({
        name: updatedUser.name,
        username: updatedUser.username,
        password_hash: updatedUser.password,
        role: updatedUser.role,
        is_active: updatedUser.active,
      })
      .eq("id", updatedUser.id);
    fetchData();
  };

  const deleteUser = async (userId) => {
    await supabase.from("users").delete().eq("id", userId);
    fetchData();
  };

  const updateExchangeRate = async (newRate) => {
    await supabase
      .from("settings")
      .upsert({ key: "exchange_rate", value: newRate }, { onConflict: "key" });
    fetchData();
  };

  const addExpense = async (newExpense) => {
    const isCashier = currentRole === "cajero" || currentUser?.role === "cajero";
    if (isCashier && !currentShiftId) {
      showError("Turno No Disponible", "Debes tener un turno de caja activo para poder registrar gastos de caja.");
      return;
    }

    const targetShiftId = isCashier ? currentShiftId : (newExpense.shiftId || null);
    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const expensePayload = {
      id: expenseId,
      shift_id: targetShiftId,
      description: newExpense.description,
      category: newExpense.category || "otros",
      amount: Number(newExpense.amount) || 0,
      is_paid: newExpense.isPaid !== false,
      notification_date: newExpense.notificationDate || null,
      created_at: new Date().toISOString(),
    };

    // Actualización UI Optimista
    const localExpenseObj = {
      id: expenseId,
      shiftId: targetShiftId,
      amount: Number(newExpense.amount) || 0,
      description: newExpense.description || "",
      category: newExpense.category || "otros",
      isPaid: newExpense.isPaid !== false,
      paymentMethod: "Efectivo",
      notificationDate: newExpense.notificationDate || null,
      date: new Date().toISOString(),
    };
    setExpenses((prev) => [localExpenseObj, ...(prev || [])]);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineAction('CREATE_EXPENSE', { expense: expensePayload });
      setPendingSyncCount(getOfflineQueue().length);
      return;
    }

    try {
      const { error } = await supabase.from("expenses").insert(expensePayload);
      if (error) {
        console.error("Error al registrar gasto en Supabase, encolando offline:", error);
        enqueueOfflineAction('CREATE_EXPENSE', { expense: expensePayload });
        setPendingSyncCount(getOfflineQueue().length);
      }
    } catch (err) {
      console.error("Fallo al registrar gasto, encolando offline:", err);
      enqueueOfflineAction('CREATE_EXPENSE', { expense: expensePayload });
      setPendingSyncCount(getOfflineQueue().length);
    }
    fetchData(true);
  };

  const updateExpense = async (updatedExpense) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          description: updatedExpense.description,
          category: updatedExpense.category,
          amount: Number(updatedExpense.amount),
          is_paid: updatedExpense.isPaid,
          notification_date: updatedExpense.notificationDate || null,
        })
        .eq("id", updatedExpense.id);
      if (error) console.error("Error al actualizar gasto:", error);
    } catch (err) {
      console.error("Fallo al actualizar gasto:", err);
    }
    fetchData();
  };

  const deleteExpense = async (expenseId) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
      if (error) console.error("Error al eliminar gasto:", error);
    } catch (err) {
      console.error("Fallo al eliminar gasto:", err);
    }
    fetchData();
  };

  const login = (username, password) => {
    const targetName = username.trim().toLowerCase();
    const targetPass = password.trim();
    const foundUser = users.find(
      (u) =>
        u.username?.toLowerCase() === targetName && u.password === targetPass,
    );

    if (!foundUser)
      return { success: false, message: "Usuario o contraseña incorrectos." };
    if (!foundUser.active)
      return { success: false, message: "Este usuario se encuentra inactivo." };

    const sessionData = {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      role: foundUser.role,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setCurrentUser(sessionData);
    setCurrentRole(foundUser.role);
    return { success: true, user: sessionData };
  };

  const loginMesero = (pin, expectedRole = null) => {
    const targetPass = pin.trim();
    const foundUser = users.find((u) => {
      let roleMatch = false;
      if (expectedRole === "cajero") {
        roleMatch = u.role === "cajero" || u.role === "super_cajero";
      } else if (expectedRole === "mesero") {
        roleMatch = u.role === "mesero";
      } else if (expectedRole) {
        roleMatch = u.role === expectedRole;
      } else {
        roleMatch = u.role === "mesero" || u.role === "cajero" || u.role === "super_cajero";
      }
      return roleMatch && u.password === targetPass;
    });

    if (!foundUser)
      return {
        success: false,
        message: expectedRole === "cajero" 
          ? "PIN incorrecto o cajero no encontrado." 
          : expectedRole === "mesero"
          ? "PIN incorrecto o mesero no encontrado."
          : "PIN incorrecto o usuario no encontrado.",
      };
    if (!foundUser.active)
      return { success: false, message: "Este usuario se encuentra inactivo." };

    const sessionData = {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      role: foundUser.role,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setCurrentUser(sessionData);
    setCurrentRole(foundUser.role);
    return { success: true, user: sessionData };
  };

  const [cancellationLogs, setCancellationLogs] = useState([]);

  const loadOrderCancellations = async (filters = {}) => {
    if (!currentUser?.id) return { success: false, data: [] };
    try {
      let rawType = filters.cancellationType || null;
      if (['ELIMINACION_PRODUCTO', 'REDUCCION_CANTIDAD'].includes(rawType)) {
        rawType = 'parcial';
      } else if (rawType === 'CANCELACION_MESA') {
        rawType = 'total';
      }

      const { data, error } = await supabase.rpc("get_order_cancellations", {
        p_user_id: currentUser.id,
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null,
        p_shift_id: filters.shiftId || null,
        p_cancellation_type: rawType,
        p_limit: filters.limit || 100,
        p_offset: filters.offset || 0,
      });
      if (error) throw error;
      setCancellationLogs(data || []);
      return { success: true, data: data || [] };
    } catch (err) {
      console.error("Error al cargar historial de auditoría:", err);
      return { success: false, error: err.message, data: [] };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  if (isLoading && !products.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-800 font-bold text-xl">
        Conectando al Servidor Principal...
      </div>
    );
  }

  return (
    <BarContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        users,
        tables,
        products,
        paidInvoices,
        currentShiftId,
        shiftStartTime,
        openingCash,
        cashRegisterHistory,
        isHistoryLoading,
        historyLoaded,
        loadShiftHistory,
        exchangeRate,
        expenses,
        isOnline,
        pendingSyncCount,
        cancellationLogs,
        loadOrderCancellations,
        syncOfflineQueue: () => syncOfflineQueue(supabase, ({ synced, remaining }) => {
          setPendingSyncCount(remaining);
          if (synced > 0) fetchData(true);
        }),
        updateTableOrder,
        sendOrderToCashier,
        payInvoice,
        payDirectInvoice,
        cancelTableOrder,
        clearUnprintedItems,
        addBarAccount,
        openShift,
        closeShift,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        addUser,
        updateUser,
        deleteUser,
        updateExchangeRate,
        addExpense,
        updateExpense,
        deleteExpense,
        login,
        loginMesero,
        logout,
        openTable,
        addNewTable,
        deleteTable,
        categories,
      }}
    >
      {children}
    </BarContext.Provider>
  );
};

export const useBar = () => {
  const context = useContext(BarContext);
  if (!context) throw new Error("useBar debe usarse dentro de un BarProvider");
  return context;
};
