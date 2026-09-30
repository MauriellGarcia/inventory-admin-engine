import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Tags, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Categoria } from '../types';

interface CategoriasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriaCreated?: (categoria: Categoria) => void;
}

export const CategoriasModal: React.FC<CategoriasModalProps> = ({
  isOpen,
  onClose,
  onCategoriaCreated,
}) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        throw error;
      }
      setCategorias(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar las categorías';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
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
          if (!isMounted) return;
          const message = err instanceof Error ? err.message : 'Error al cargar las categorías';
          setErrorMessage(message);
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMessage('El nombre de la categoría es obligatorio.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([
          {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
          },
        ])
        .select()
        .single();


      if (error) {
        throw error;
      }

      const createdCat = data as Categoria;
      setSuccessMessage(`Categoría "${createdCat.nombre}" creada con éxito.`);
      setNombre('');
      setDescripcion('');
      
      // Actualizar la lista local y notificar al componente padre
      setCategorias((prev) => [...prev, createdCat].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      if (onCategoriaCreated) {
        onCategoriaCreated(createdCat);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la categoría.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Gestión de Categorías</h3>
              <p className="text-xs text-slate-500">Crea y consulta las categorías de productos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {/* Form to create new category */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Nueva Categoría
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cat-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cat-nombre"
                  type="text"
                  placeholder="Ej. Audio, Monitores, Muebles..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="cat-desc" className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  id="cat-desc"
                  type="text"
                  placeholder="Breve descripción o uso..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !nombre.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shadow-indigo-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Categoría</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* List of existing categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>Categorías Existentes</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-mono text-[11px]">
                  {categorias.length}
                </span>
              </h4>
              <button
                type="button"
                onClick={fetchCategorias}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Actualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            {loading && categorias.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-xs font-medium">Cargando categorías...</p>
              </div>
            ) : categorias.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Tags className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No hay categorías registradas aún.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Usa el formulario de arriba para agregar la primera.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {categorias.map((cat) => (
                  <div key={cat.id} className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                        <span>{cat.nombre}</span>
                      </div>
                      {cat.descripcion && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{cat.descripcion}</div>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 shrink-0">
                      {cat.id.length > 8 ? `${cat.id.substring(0, 8)}...` : cat.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
