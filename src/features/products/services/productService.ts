import { supabase } from '../../../lib/supabase';
import type { Producto } from '../../../types';

/**
 * Obtiene la lista de productos.
 */
export async function getProductos(): Promise<{ data: Producto[] | null; error: any }> {
  const { data, error } = await supabase.from('productos').select('*').order('nombre', { ascending: true });
  return { data, error };
}

/**
 * Crea un nuevo producto.
 */
export async function crearProducto(params: {
  nombre: string;
  descripcion?: string;
  categoria_id: string;
  precio: number;
  stock_disponible: number;
  sku?: string;
}): Promise<{ data: Producto | null; error: any }> {
  const payload = {
    nombre: params.nombre.trim(),
    descripcion: params.descripcion?.trim() || null,
    categoria_id: params.categoria_id,
    precio: params.precio,
    stock_disponible: params.stock_disponible,
    sku: params.sku,
  };
  const { data, error } = await supabase.from('productos').insert([payload]).select().single();
  return { data, error };
}

/**
 * Llama al RPC de Supabase para obtener el siguiente SKU consecutivo
 * basado en el prefijo de la categoría.
 *
 * @param categoriaId - ID de la categoría seleccionada.
 * @returns El código SKU generado como string.
 */
export async function obtenerSiguienteSKU(categoriaId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generar_siguiente_sku', { p_categoria_id: categoriaId });
  if (error) {
    console.error('Error al generar SKU con RPC generar_siguiente_sku:', error);
    return '';
  }
  return (data as string) || '';
}
