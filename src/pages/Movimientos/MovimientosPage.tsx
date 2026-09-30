import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Loader2, RefreshCw, Boxes } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MovimientoInventario } from '../../types';

export const MovimientosPage: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase Warning] Error al cargar movimientos:', error.message);
      } else {
        setMovimientos((data as MovimientoInventario[]) || []);
      }
    } catch (err: unknown) {
      console.error('[Supabase Error] Error al cargar movimientos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('movimientos_inventario')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isMounted) return;
        if (error) {
          console.warn('[Supabase Warning] Error al cargar movimientos:', error.message);
        } else {
          setMovimientos((data as MovimientoInventario[]) || []);
        }
      } catch (err: unknown) {
        console.error('[Supabase Error] Movimientos:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kardex / Movimientos</h2>
          <p className="text-sm text-slate-500">Historial de entradas, salidas y ajustes de inventario</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMovimientos}
            disabled={loading}
            title="Actualizar movimientos"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-600">Cargando movimientos de inventario...</p>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No hay movimientos registrados</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Las entradas, salidas y ajustes del inventario se registrarán en la tabla movimientos_inventario.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Fecha & Hora</th>
                  <th className="px-6 py-3.5">Tipo</th>
                  <th className="px-6 py-3.5">ID Producto</th>
                  <th className="px-6 py-3.5 text-center">Cantidad</th>
                  <th className="px-6 py-3.5">Motivo / Detalle</th>
                  <th className="px-6 py-3.5">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.map((mov) => {
                  const isEntrada = mov.tipo === 'ENTRADA';
                  const isSalida = mov.tipo === 'SALIDA';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {mov.created_at ? new Date(mov.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isEntrada
                              ? 'bg-emerald-100 text-emerald-700'
                              : isSalida
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isEntrada && <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {isSalida && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {!isEntrada && !isSalida && <ArrowLeftRight className="w-3.5 h-3.5" />}
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {mov.producto?.nombre || `Producto #${mov.producto_id}`}
                        </div>
                        {mov.producto?.sku && (
                          <div className="text-xs font-mono text-slate-400">{mov.producto.sku}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{mov.motivo || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {mov.referencia || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
