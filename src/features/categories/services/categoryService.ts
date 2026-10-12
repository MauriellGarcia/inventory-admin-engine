import { supabase } from '../../../lib/supabase';
import type { Categoria } from '../../../types';

/**
 * Obtiene la lista de categorías ordenadas por nombre.
 * Siempre retorna un objeto con la forma `{ data, error }`.
 */
export async function getCategorias(): Promise<{ data: Categoria[] | null; error: any }> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true });
  return { data, error };
}

/**
 * Crea una nueva categoría.
 * @param params Objeto con `nombre`, `descripcion` (opcional) y `prefijo` (opcional).
 * @returns `{ data, error }` donde `data` es la categoría creada.
 */
export async function createCategoria(params: {
  nombre: string;
  descripcion?: string;
  prefijo?: string;
}): Promise<{ data: Categoria | null; error: any }> {
  // Generate prefijo: first 4 letters of name, uppercase, no spaces/accents si no se envía
  const prefijoCalculado = params.prefijo?.trim() || params.nombre.trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 4)
    .toUpperCase();

  const payload = {
    nombre: params.nombre.trim(),
    descripcion: params.descripcion?.trim() || undefined,
    prefijo: prefijoCalculado,
    ultimo_consecutivo: 0,
  };

  const { data, error } = await supabase
    .from('categorias')
    .insert([payload])
    .select()
    .single();

  return { data, error };
}
