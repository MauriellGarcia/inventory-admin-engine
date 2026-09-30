import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Producto, MovimientoInventario } from '../types';

export const DashboardPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMessage(null);

    try {
      // 1. Consultar todos los productos reales de la tabla 'productos'
      const { data: prodsData, error: prodsError } = await supabase
        .from('productos')
        .select('*, categorias(*)')
        .order('created_at', { ascending: false });

      if (prodsError) {
        console.error('[Supabase Error] Error al consultar tabla productos:', prodsError);
        throw prodsError;
      }

      setProductos((prodsData as Producto[]) || []);

      // 2. Consultar últimos registros de 'movimientos_inventario'
      const { data: movsData, error: movsError } = await supabase
        .from('movimientos_inventario')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (movsError) {
        console.warn('[Supabase Warning] No se pudieron cargar movimientos:', movsError.message);
      } else {
        setMovimientos((movsData as MovimientoInventario[]) || []);
      }
    } catch (err: unknown) {
      console.error('[Supabase Error] Error en Dashboard:', err);
      const msg = err instanceof Error ? err.message : 'Error al cargar los datos del Dashboard';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const { data: prodsData, error: prodsError } = await supabase
          .from('productos')
          .select('*, categorias(*)')
          .order('created_at', { ascending: false });

        if (!isMounted) return;
        if (prodsError) {
          console.error('[Supabase Error] Error al consultar productos:', prodsError);
          setErrorMessage(prodsError.message);
        } else {
          setProductos((prodsData as Producto[]) || []);
        }

        const { data: movsData, error: movsError } = await supabase
          .from('movimientos_inventario')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!isMounted) return;
        if (movsError) {
          console.warn('[Supabase Warning] Movimientos:', movsError.message);
        } else {
          setMovimientos((movsData as MovimientoInventario[]) || []);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('[Supabase Error] Inicialización Dashboard:', err);
        const msg = err instanceof Error ? err.message : 'Error al cargar los datos';
        setErrorMessage(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cálculos reactivos con datos reales
  const totalProductos = productos.length;

  const totalValorInventario = useMemo(() => {
    return productos.reduce((acc, p) => {
      const precio = Number(p.precio) || 0;
      const stock = Number(p.stock_disponible) || 0;
      return acc + precio * stock;
    }, 0);
  }, [productos]);

  const totalUnidadesStock = useMemo(() => {
    return productos.reduce((acc, p) => acc + (Number(p.stock_disponible) || 0), 0);
  }, [productos]);

  const criticalStockProducts = useMemo(() => {
    return productos
      .filter((p) => Number(p.stock_disponible) < 5)
      .sort((a, b) => a.stock_disponible - b.stock_disponible);
  }, [productos]);

  const stockCriticoCount = criticalStockProducts.length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            Panel de Control
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Métricas en tiempo real sincronizadas con Supabase
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboardData(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer hover:border-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-sm text-rose-800 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Error al sincronizar con la base de datos</div>
            <div className="text-xs text-rose-600 mt-0.5">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Productos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Productos
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? (
                <span className="inline-block w-12 h-7 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                totalProductos
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs font-medium text-slate-500">
                {totalUnidadesStock} unidades en almacén
              </span>
            </div>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Valor Total del Inventario */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Valor del Inventario
            </span>
            <div className="text-3xl font-bold text-emerald-600 mt-1 font-mono">
              {loading ? (
                <span className="inline-block w-24 h-7 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                formatCurrency(totalValorInventario)
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                Suma (Precio × Stock)
              </span>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Crítico (&lt; 5)
            </span>
            <div className="text-3xl font-bold text-rose-600 mt-1">
              {loading ? (
                <span className="inline-block w-12 h-7 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                `${stockCriticoCount} ${stockCriticoCount === 1 ? 'artículo' : 'artículos'}`
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stockCriticoCount > 0
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {stockCriticoCount > 0 ? 'Requiere reposición' : 'Inventario óptimo'}
              </span>
            </div>
          </div>
          <div
            className={`p-3.5 rounded-2xl ${
              stockCriticoCount > 0
                ? 'bg-rose-50 text-rose-600'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Movimientos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Movimientos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Últimos Movimientos</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Tabla: movimientos_inventario</span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs">Consultando movimientos...</p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="py-10 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">No hay movimientos registrados</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Los registros de entrada/salida aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {movimientos.map((mov) => {
                const isEntrada = mov.tipo === 'ENTRADA';
                const isSalida = mov.tipo === 'SALIDA';

                return (
                  <div key={mov.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isEntrada
                            ? 'bg-emerald-50 text-emerald-600'
                            : isSalida
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {isEntrada ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : isSalida ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowLeftRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {mov.motivo || `Movimiento de ${mov.tipo.toLowerCase()}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {mov.created_at
                            ? new Date(mov.created_at).toLocaleString()
                            : 'Fecha no registrada'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        isEntrada
                          ? 'bg-emerald-50 text-emerald-700'
                          : isSalida
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad} uds
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas de Stock Crítico */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Alertas de Stock Crítico</h3>
            </div>
            <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
              Stock &lt; 5 unidades
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              <p className="text-xs">Evaluando niveles de stock...</p>
            </div>
          ) : criticalStockProducts.length === 0 ? (
            <div className="py-10 text-center bg-emerald-50/40 rounded-xl border border-dashed border-emerald-200">
              <Package className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <p className="text-xs font-semibold text-emerald-800">¡Todo en orden!</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                No hay productos con stock menor a 5 unidades.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {criticalStockProducts.slice(0, 5).map((prod) => (
                <div key={prod.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{prod.nombre}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      SKU: {prod.sku} • {prod.categorias?.nombre || 'Sin categoría'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        prod.stock_disponible === 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {prod.stock_disponible === 0 ? 'Agotado (0)' : `${prod.stock_disponible} en stock`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
