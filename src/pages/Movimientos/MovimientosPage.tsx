import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Loader2,
  RefreshCw,
  Boxes,
  CheckCircle2,
  AlertCircle,
  X,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Producto } from '../../types';

// ---------------------------------------------------------------------------
// Local types – aligned with actual Supabase column names
// ---------------------------------------------------------------------------
type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

interface MovimientoRow {
  id: number;
  producto_id: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  motivo?: string | null;
  usuario_email?: string | null;
  created_at?: string;
  // Joined relation
  productos?: { nombre: string; sku: string } | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const MovimientosPage: React.FC = () => {
  // ---- Data state ----------------------------------------------------------
  const [movimientos, setMovimientos] = useState<MovimientoRow[]>([]);
  const [productosLista, setProductosLista] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ---- Filter state --------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<TipoMovimiento | 'TODOS'>('TODOS');

  // ---- Modal state ---------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ---- Form fields ---------------------------------------------------------
  const [formProductoId, setFormProductoId] = useState<string>('');
  const [formTipo, setFormTipo] = useState<TipoMovimiento>('ENTRADA');
  const [formCantidad, setFormCantidad] = useState<string>('');
  const [formMotivo, setFormMotivo] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ---- Feedback toast ------------------------------------------------------
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // =========================================================================
  // DATA FETCHING
  // =========================================================================
  const fetchMovimientos = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .select('*, productos(nombre, sku)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase Error] Movimientos:', error);
        showFeedback('error', 'Error al cargar movimientos: ' + error.message);
      } else {
        setMovimientos((data as MovimientoRow[]) || []);
      }
    } catch (err: unknown) {
      console.error('[Supabase Error] Movimientos:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar movimientos.';
      showFeedback('error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, sku, stock_disponible')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('[Supabase Error] Productos:', error);
        showFeedback('error', 'Error al cargar productos: ' + error.message);
      } else {
        setProductosLista((data as Producto[]) || []);
      }
    } catch (err: unknown) {
      console.error('[Supabase Error] Productos:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar productos.';
      showFeedback('error', message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [movRes, prodRes] = await Promise.all([
          supabase
            .from('movimientos_inventario')
            .select('*, productos(nombre, sku)')
            .order('created_at', { ascending: false }),
          supabase
            .from('productos')
            .select('id, nombre, sku, stock_disponible')
            .order('nombre', { ascending: true }),
        ]);

        if (!isMounted) return;
        if (movRes.data) setMovimientos(movRes.data as MovimientoRow[]);
        if (prodRes.data) setProductosLista(prodRes.data as Producto[]);
        if (movRes.error) {
          console.error('[Supabase Error] Movimientos:', movRes.error);
          showFeedback('error', 'Error al cargar movimientos: ' + movRes.error.message);
        }
        if (prodRes.error) {
          console.error('[Supabase Error] Productos:', prodRes.error);
          showFeedback('error', 'Error al cargar productos: ' + prodRes.error.message);
        }
      } catch (err: unknown) {
        console.error('[Supabase Error] Init:', err);
        const message = err instanceof Error ? err.message : 'Error desconocido al cargar el Kardex.';
        showFeedback('error', message);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================================
  // METRICS (computed)
  // =========================================================================
  const totalMovimientos = movimientos.length;

  const totalEntradas = useMemo(
    () =>
      movimientos
        .filter((m) => m.tipo_movimiento === 'ENTRADA')
        .reduce((acc, m) => acc + (m.cantidad || 0), 0),
    [movimientos],
  );

  const totalSalidas = useMemo(
    () =>
      movimientos
        .filter((m) => m.tipo_movimiento === 'SALIDA')
        .reduce((acc, m) => acc + (m.cantidad || 0), 0),
    [movimientos],
  );

  // =========================================================================
  // FILTERING
  // =========================================================================
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter((m) => {
      const nombre = m.productos?.nombre?.toLowerCase() || '';
      const sku = m.productos?.sku?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      const matchSearch = nombre.includes(term) || sku.includes(term);
      const matchTipo = filterTipo === 'TODOS' || m.tipo_movimiento === filterTipo;
      return matchSearch && matchTipo;
    });
  }, [movimientos, searchTerm, filterTipo]);

  // =========================================================================
  // MODAL HELPERS
  // =========================================================================
  const handleOpenModal = () => {
    setFormProductoId('');
    setFormTipo('ENTRADA');
    setFormCantidad('');
    setFormMotivo('');
    setFormErrors({});
    setModalError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formProductoId) errors.producto = 'Selecciona un producto.';
    const qty = Number(formCantidad);
    const minCantidad = formTipo === 'AJUSTE' ? 0 : 1;
    if (!formCantidad.trim() || !Number.isSafeInteger(qty) || qty < minCantidad) {
      errors.cantidad =
        formTipo === 'AJUSTE'
          ? 'Ingresa un stock final válido (entero mayor o igual a 0).'
          : 'Ingresa una cantidad válida mayor a 0.';
    }
    if (!formMotivo.trim()) errors.motivo = 'Ingresa un motivo para el movimiento.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // =========================================================================
  // SUBMIT – register manual movement
  // =========================================================================
  const handleSubmitMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // a) Get active user email
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw new Error('No se pudo verificar el usuario activo: ' + userError.message);
      if (!user?.email) throw new Error('Debes iniciar sesión para registrar un movimiento.');
      const userEmail = user.email;

      const cantidad = Number(formCantidad);
      const productoId = Number(formProductoId);

      // b) Fetch current stock
      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('stock_disponible, nombre')
        .eq('id', productoId)
        .single();

      if (prodError || !prodData) {
        throw new Error('No se pudo obtener el stock actual del producto.');
      }

      const stockActual = Number(prodData.stock_disponible);
      const nombreProducto: string = prodData.nombre;
      if (!Number.isSafeInteger(stockActual) || stockActual < 0) {
        throw new Error('El producto tiene un stock actual inválido; no se puede registrar el movimiento.');
      }

      // c) Calculate new stock
      let nuevoStock: number;
      if (formTipo === 'ENTRADA') {
        nuevoStock = stockActual + cantidad;
      } else if (formTipo === 'SALIDA') {
        nuevoStock = stockActual - cantidad;
        if (nuevoStock < 0) {
          setModalError(
            `Stock insuficiente. El producto "${nombreProducto}" solo tiene ${stockActual} unidades disponibles.`,
          );
          return;
        }
      } else {
        // AJUSTE → set directly to the given quantity
        nuevoStock = cantidad;
      }
      if (!Number.isSafeInteger(nuevoStock) || nuevoStock < 0) {
        throw new Error('El movimiento produciría un stock inválido.');
      }

      // d) Update stock in productos
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock_disponible: nuevoStock })
        .eq('id', productoId);

      if (updateError) {
        console.error('[Supabase Error] Update stock:', updateError);
        throw new Error('Error al actualizar el stock del producto: ' + updateError.message);
      }

      // e) Insert movement record
      const payloadMov = {
        producto_id: productoId,
        tipo_movimiento: formTipo,
        cantidad,
        motivo: formMotivo.trim(),
        usuario_email: userEmail,
      };

      const { error: movError } = await supabase
        .from('movimientos_inventario')
        .insert([payloadMov]);

      if (movError) {
        console.error('[Supabase Error] Insert movimiento:', movError);
        throw new Error('Stock actualizado, pero falló el registro del movimiento: ' + movError.message);
      }

      showFeedback('success', `Movimiento de ${formTipo} registrado para "${nombreProducto}".`);

      // f) Reload
      await Promise.all([fetchMovimientos(true), fetchProductos()]);

      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('[Supabase Error] handleSubmitMovimiento:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido al registrar el movimiento.';
      setModalError(msg);
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // BADGE HELPER
  // =========================================================================
  const tipoBadge = (tipo: TipoMovimiento) => {
    const map: Record<TipoMovimiento, { bg: string; text: string; icon: React.ReactNode }> = {
      ENTRADA: {
        bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        text: 'ENTRADA',
        icon: <ArrowDownLeft className="w-3.5 h-3.5" />,
      },
      SALIDA: {
        bg: 'bg-rose-100 text-rose-700 border-rose-200',
        text: 'SALIDA',
        icon: <ArrowUpRight className="w-3.5 h-3.5" />,
      },
      AJUSTE: {
        bg: 'bg-blue-100 text-blue-700 border-blue-200',
        text: 'AJUSTE',
        icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
      },
    };
    const { bg, text, icon } = map[tipo] ?? map.AJUSTE;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${bg}`}>
        {icon}
        {text}
      </span>
    );
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* ── Toast Notification ─────────────────────────────────────────── */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-indigo-600" />
            Kardex / Movimientos
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Historial de entradas, salidas y ajustes de inventario
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* ── Metrics Bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Movimientos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Movimientos
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalMovimientos}</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Total Entradas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unidades Entrada
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">+{totalEntradas}</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Salidas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unidades Salida
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-0.5">-{totalSalidas}</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Type Dropdown */}
          <div className="w-full sm:w-52">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as TipoMovimiento | 'TODOS')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Refresh */}
          <button
            type="button"
            onClick={() => void Promise.all([fetchMovimientos(true), fetchProductos()])}
            disabled={refreshing || loading}
            title="Recargar movimientos"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Movements Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-600">Cargando movimientos de inventario...</p>
          </div>
        ) : filteredMovimientos.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Boxes className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No se encontraron movimientos</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchTerm || filterTipo !== 'TODOS'
                ? 'Prueba ajustando los filtros de búsqueda o tipo.'
                : 'Las entradas, salidas y ajustes del inventario aparecerán aquí.'}
            </p>
            {(searchTerm || filterTipo !== 'TODOS') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterTipo('TODOS');
                }}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Fecha &amp; Hora</th>
                  <th className="px-6 py-3.5">Tipo</th>
                  <th className="px-6 py-3.5">Producto</th>
                  <th className="px-6 py-3.5 text-center">Cantidad</th>
                  <th className="px-6 py-3.5">Motivo / Detalle</th>
                  <th className="px-6 py-3.5">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovimientos.map((mov) => {
                  const isEntrada = mov.tipo_movimiento === 'ENTRADA';
                  const isSalida = mov.tipo_movimiento === 'SALIDA';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Fecha */}
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {mov.created_at ? new Date(mov.created_at).toLocaleString() : '—'}
                      </td>

                      {/* Tipo Badge */}
                      <td className="px-6 py-4">{tipoBadge(mov.tipo_movimiento)}</td>

                      {/* Producto */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {mov.productos?.nombre || `Producto #${mov.producto_id}`}
                        </div>
                        {mov.productos?.sku && (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60">
                            {mov.productos.sku}
                          </span>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${
                            isEntrada
                              ? 'text-emerald-600'
                              : isSalida
                              ? 'text-rose-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="px-6 py-4 text-slate-600 text-xs max-w-[220px] truncate">
                        {mov.motivo || '—'}
                      </td>

                      {/* Usuario */}
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {mov.usuario_email || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Nuevo Movimiento ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nuevo Movimiento Manual</h3>
                  <p className="text-xs text-slate-500">Registra una entrada, salida o ajuste de inventario</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitMovimiento} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{modalError}</div>
                </div>
              )}

              {/* Producto */}
              <div>
                <label htmlFor="mov-producto" className="block text-xs font-semibold text-slate-700 mb-1">
                  Producto <span className="text-rose-500">*</span>
                </label>
                <select
                  id="mov-producto"
                  value={formProductoId}
                  onChange={(e) => {
                    setFormProductoId(e.target.value);
                    if (formErrors.producto) setFormErrors((p) => ({ ...p, producto: '' }));
                  }}
                  className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 transition-all cursor-pointer ${
                    formErrors.producto
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                >
                  <option value="">— Selecciona un producto —</option>
                  {productosLista.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre} ({prod.sku}) — Stock: {prod.stock_disponible}
                    </option>
                  ))}
                </select>
                {formErrors.producto && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.producto}</p>
                )}
              </div>

              {/* Tipo de Movimiento */}
              <div>
                <label htmlFor="mov-tipo" className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Movimiento <span className="text-rose-500">*</span>
                </label>
                <select
                  id="mov-tipo"
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value as TipoMovimiento)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                  <option value="AJUSTE">Ajuste</option>
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label htmlFor="mov-cantidad" className="block text-xs font-semibold text-slate-700 mb-1">
                  {formTipo === 'AJUSTE' ? 'Stock final' : 'Cantidad'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="mov-cantidad"
                  type="number"
                  step="1"
                  min={formTipo === 'AJUSTE' ? '0' : '1'}
                  placeholder={formTipo === 'AJUSTE' ? 'Ej. 0' : 'Ej. 10'}
                  value={formCantidad}
                  onChange={(e) => {
                    setFormCantidad(e.target.value);
                    if (formErrors.cantidad) setFormErrors((p) => ({ ...p, cantidad: '' }));
                  }}
                  className={`w-full px-3.5 py-2 text-sm font-mono bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    formErrors.cantidad
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                {formErrors.cantidad && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.cantidad}</p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label htmlFor="mov-motivo" className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Detalle <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="mov-motivo"
                  rows={3}
                  placeholder="Ej. Compra a proveedor, Venta mostrador, Ajuste por inventario físico..."
                  value={formMotivo}
                  onChange={(e) => {
                    setFormMotivo(e.target.value);
                    if (formErrors.motivo) setFormErrors((p) => ({ ...p, motivo: '' }));
                  }}
                  className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all resize-none ${
                    formErrors.motivo
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                {formErrors.motivo && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.motivo}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
