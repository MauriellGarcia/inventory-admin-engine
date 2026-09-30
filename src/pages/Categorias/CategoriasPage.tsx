import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Tags, Layers, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Categoria } from '../../types';
import { CategoriasModal } from '../../components/CategoriasModal';

export const CategoriasPage: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (err: unknown) {
      console.error('Error al cargar categorías:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .order('nombre', { ascending: true });

        if (!isMounted) return;
        if (error) throw error;
        setCategorias(data || []);
      } catch (err: unknown) {
        console.error('Error al cargar categorías:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);


  const handleCategoriaCreated = (newCat: Categoria) => {
    setCategorias((prev) => [...prev, newCat].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Tags className="w-7 h-7 text-indigo-600" />
            Categorías
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Estructura taxonómica para agrupar y filtrar productos del inventario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCategorias}
            disabled={loading}
            title="Actualizar lista"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && categorias.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Cargando categorías de Supabase...</p>
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Tags className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No hay categorías registradas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Crea tu primera categoría para organizar los productos del catálogo.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primera categoría</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Tags className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {cat.id.length > 8 ? `${cat.id.substring(0, 8)}...` : cat.id}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base mt-3">{cat.nombre}</h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-3">
                  {cat.descripcion || 'Sin descripción asignada.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Catálogo Activo
                </span>
                {cat.created_at && (
                  <span className="text-[11px] text-slate-400">
                    {new Date(cat.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categorias Modal */}
      <CategoriasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCategoriaCreated={handleCategoriaCreated}
      />
    </div>
  );
};
