import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Tags,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Package,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  FolderPlus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Producto, Categoria } from '../types';
import { CategoriasModal } from '../components/CategoriasModal';

export const ProductosPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modals state
  const [isCategoriasModalOpen, setIsCategoriasModalOpen] = useState<boolean>(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form Fields
  const [formNombre, setFormNombre] = useState<string>('');
  const [formSku, setFormSku] = useState<string>('');
  const [formPrecio, setFormPrecio] = useState<string>('');
  const [formStock, setFormStock] = useState<string>('');
  const [formCategoriaId, setFormCategoriaId] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Error in Modal
  const [modalError, setModalError] = useState<string | null>(null);

  // Global Feedback Toast/Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Fetch Categories
  const fetchCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (err: unknown) {
      console.error('[Supabase Error] Error al cargar categorías:', err);
    }
  }, []);

  // Fetch Products with join on categorias
  const fetchProductos = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*, categorias(*)')
        .order('id', { ascending: false });

      if (error) throw error;
      setProductos((data as Producto[]) || []);
    } catch (err: unknown) {
      console.error('[Supabase Error] Error al obtener inventario de productos:', err);
      const msg = err instanceof Error ? err.message : 'Error al obtener el inventario de productos.';
      showFeedback('error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categorias').select('*').order('nombre', { ascending: true }),
          supabase.from('productos').select('*, categorias(*)').order('id', { ascending: false }),
        ]);

        if (!isMounted) return;
        if (catRes.data) setCategorias(catRes.data);
        if (prodRes.data) setProductos(prodRes.data as Producto[]);
        if (catRes.error) console.error('[Supabase Error] Categorías:', catRes.error);
        if (prodRes.error) console.error('[Supabase Error] Productos:', prodRes.error);
      } catch (err: unknown) {
        console.error('[Supabase Error] Inicialización fallida:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormNombre('');
    setFormSku('');
    setFormPrecio('');
    setFormStock('0');
    setFormCategoriaId('');
    setFormErrors({});
    setModalError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setFormNombre(producto.nombre);
    setFormSku(producto.sku);
    setFormPrecio(producto.precio.toString());
    setFormStock(producto.stock_disponible.toString());
    setFormCategoriaId(producto.categoria_id || '');
    setFormErrors({});
    setModalError(null);
    setIsFormModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formNombre.trim()) {
      errors.nombre = 'El nombre del producto es obligatorio.';
    }

    if (!formSku.trim()) {
      errors.sku = 'El código SKU es obligatorio.';
    }

    const parsedPrecio = parseFloat(formPrecio);
    if (formPrecio.trim() === '' || isNaN(parsedPrecio) || parsedPrecio < 0) {
      errors.precio = 'Ingresa un precio válido mayor o igual a 0.';
    }

    const parsedStock = parseInt(formStock, 10);
    if (formStock.trim() === '' || isNaN(parsedStock) || parsedStock < 0) {
      errors.stock = 'Ingresa una cantidad de stock válida (entero mayor o igual a 0).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Product (Create or Update)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        nombre: formNombre.trim(),
        sku: formSku.trim().toUpperCase(),
        precio: parseFloat(formPrecio),
        stock_disponible: parseInt(formStock, 10),
        categoria_id: formCategoriaId ? formCategoriaId : null,
      };

      if (editingProduct) {
        // UPDATE en tabla 'productos'
        const { data, error } = await supabase
          .from('productos')
          .update(payload)
          .eq('id', editingProduct.id)
          .select('*, categorias(*)')
          .single();

        if (error) {
          console.error('[Supabase Error] Update falló:', error);
          throw error;
        }

        const updatedProd = data as Producto;
        setProductos((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? updatedProd : p))
        );
        showFeedback('success', `Producto "${updatedProd.nombre}" actualizado con éxito.`);
      } else {
        // INSERT en tabla 'productos'
        const { data, error } = await supabase
          .from('productos')
          .insert([payload])
          .select('*, categorias(*)')
          .single();

        if (error) {
          console.error('[Supabase Error] Insert falló:', error);
          throw error;
        }

        const createdProd = data as Producto;
        setProductos((prev) => [createdProd, ...prev]);
        showFeedback('success', `Producto "${createdProd.nombre}" registrado con éxito.`);
      }

      setIsFormModalOpen(false);
    } catch (err: unknown) {
      console.error('[Supabase Error] Error al guardar producto:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido al guardar el producto.';
      setModalError(msg);
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productToDelete.id);

      if (error) {
        console.error('[Supabase Error] Delete falló:', error);
        throw error;
      }

      setProductos((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showFeedback('success', `Producto "${productToDelete.nombre}" eliminado correctamente.`);
      setProductToDelete(null);
    } catch (err: unknown) {
      console.error('[Supabase Error] Error al eliminar producto:', err);
      const msg = err instanceof Error ? err.message : 'Error al eliminar el producto.';
      showFeedback('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Callback when a category is created inside CategoriasModal
  const handleCategoriaCreated = (newCat: Categoria) => {
    fetchCategorias();
    if (isFormModalOpen) {
      setFormCategoriaId(newCat.id);
    }
  };



  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategoria =
        selectedCategoria === 'ALL' ||
        (selectedCategoria === 'UNASSIGNED'
          ? !p.categoria_id
          : p.categoria_id === selectedCategoria);

      const matchLowStock = onlyLowStock ? p.stock_disponible < 5 : true;

      return matchSearch && matchCategoria && matchLowStock;
    });
  }, [productos, searchTerm, selectedCategoria, onlyLowStock]);

  const totalStockItems = useMemo(
    () => productos.reduce((acc, p) => acc + (p.stock_disponible || 0), 0),
    [productos]
  );

  const lowStockCount = useMemo(
    () => productos.filter((p) => p.stock_disponible < 5).length,
    [productos]
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600" />
            Gestión de Productos
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Catálogo centralizado de artículos, control de stock y fijación de precios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCategoriasModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer hover:border-slate-300"
          >
            <Tags className="w-4 h-4 text-indigo-600" />
            <span>Categorías</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Productos
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{productos.length}</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unidades en Stock
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalStockItems}</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Bajo (&lt; 5)
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-0.5">{lowStockCount}</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
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

          {/* Category Dropdown */}
          <div className="w-full sm:w-56">
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
              <option value="UNASSIGNED">Sin Categoría</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Filter Low Stock Toggle */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              onlyLowStock
                ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Stock Crítico</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-200/80 text-rose-800 rounded-full text-[10px]">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchProductos(true)}
            disabled={refreshing || loading}
            title="Recargar inventario"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-600">Cargando inventario desde Supabase...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No se encontraron productos</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchTerm || selectedCategoria !== 'ALL' || onlyLowStock
                ? 'Prueba ajustando los filtros de búsqueda o categoría.'
                : 'Empieza agregando tu primer producto con el botón superior.'}
            </p>
            {(searchTerm || selectedCategoria !== 'ALL' || onlyLowStock) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategoria('ALL');
                  setOnlyLowStock(false);
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
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Nombre</th>
                  <th className="px-6 py-3.5">Categoría</th>
                  <th className="px-6 py-3.5 text-right">Precio</th>
                  <th className="px-6 py-3.5 text-center">Stock</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isLow = prod.stock_disponible < 5;
                  const isZero = prod.stock_disponible === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* SKU */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60">
                          {prod.sku}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{prod.nombre}</div>
                        {prod.created_at && (
                          <div className="text-[11px] text-slate-400">
                            ID #{prod.id} • {new Date(prod.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {prod.categorias?.nombre ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs rounded-lg font-medium">
                            <Tags className="w-3 h-3" />
                            {prod.categorias.nombre}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin categoría</span>
                        )}
                      </td>

                      {/* Precio */}
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        ${Number(prod.precio).toFixed(2)}
                      </td>

                      {/* Stock con indicador visual */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {isZero ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              0 uds (Agotado)
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {prod.stock_disponible} uds (Bajo)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {prod.stock_disponible} uds
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar producto"
                            aria-label={`Editar ${prod.nombre}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar producto"
                            aria-label={`Eliminar ${prod.nombre}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar Producto */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingProduct
                      ? `Modificando ID #${editingProduct.id}`
                      : 'Completa los datos del producto para el inventario'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{modalError}</div>
                </div>
              )}

              {/* Nombre */}

              <div>
                <label htmlFor="prod-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto <span className="text-rose-500">*</span>
                </label>
                <input
                  id="prod-nombre"
                  type="text"
                  placeholder="Ej. Monitor 27 pulgadas IPS..."
                  value={formNombre}
                  onChange={(e) => {
                    setFormNombre(e.target.value);
                    if (formErrors.nombre) setFormErrors((p) => ({ ...p, nombre: '' }));
                  }}
                  className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    formErrors.nombre
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                {formErrors.nombre && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="prod-sku" className="block text-xs font-semibold text-slate-700 mb-1">
                  Código SKU <span className="text-rose-500">*</span>
                </label>
                <input
                  id="prod-sku"
                  type="text"
                  placeholder="Ej. PROD-001, TECH-99"
                  value={formSku}
                  onChange={(e) => {
                    setFormSku(e.target.value);
                    if (formErrors.sku) setFormErrors((p) => ({ ...p, sku: '' }));
                  }}
                  className={`w-full px-3.5 py-2 text-sm font-mono bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all uppercase ${
                    formErrors.sku
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                {formErrors.sku && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.sku}</p>
                )}
              </div>

              {/* Grid: Precio y Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-precio" className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="prod-precio"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formPrecio}
                    onChange={(e) => {
                      setFormPrecio(e.target.value);
                      if (formErrors.precio) setFormErrors((p) => ({ ...p, precio: '' }));
                    }}
                    className={`w-full px-3.5 py-2 text-sm font-mono bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                      formErrors.precio
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.precio && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.precio}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="prod-stock" className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={formStock}
                    onChange={(e) => {
                      setFormStock(e.target.value);
                      if (formErrors.stock) setFormErrors((p) => ({ ...p, stock: '' }));
                    }}
                    className={`w-full px-3.5 py-2 text-sm font-mono bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                      formErrors.stock
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.stock && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.stock}</p>
                  )}
                </div>
              </div>

              {/* Categoría Selector with Quick Create Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="prod-cat" className="block text-xs font-semibold text-slate-700">
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoriasModalOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Gestionar categorías</span>
                  </button>
                </div>
                <select
                  id="prod-cat"
                  value={formCategoriaId}
                  onChange={(e) => setFormCategoriaId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Sin Categoría --</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shadow-indigo-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Actualizar Producto' : 'Crear Producto'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">¿Eliminar Producto?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 leading-relaxed">
              Estás a punto de eliminar definitivamente el producto{' '}
              <strong className="text-slate-900">{productToDelete.nombre}</strong> (SKU:{' '}
              <span className="font-mono">{productToDelete.sku}</span>).
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProduct}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shadow-rose-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categorias Modal */}
      <CategoriasModal
        isOpen={isCategoriasModalOpen}
        onClose={() => setIsCategoriasModalOpen(false)}
        onCategoriaCreated={handleCategoriaCreated}
      />
    </div>
  );
};

export default ProductosPage;
