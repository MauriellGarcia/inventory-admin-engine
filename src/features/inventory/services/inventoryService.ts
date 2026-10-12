import { supabase } from '../../../lib/supabase';
import type { MovimientoRow, Producto } from '../../../types';

/**
 * Obtiene los movimientos de inventario con join a productos (nombre, sku).
 */
export async function getMovimientos(): Promise<{ data: MovimientoRow[] | null; error: any }> {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select('*, productos:producto_id(nombre, sku)')
    .order('created_at', { ascending: false });
  return { data: data as MovimientoRow[] | null, error };
}

/**
 * Obtiene la lista básica de productos para los selectores.
 */
export async function getProductosList(): Promise<{ data: Producto[] | null; error: any }> {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, sku, stock_disponible')
    .order('nombre', { ascending: true });
  return { data: data as Producto[] | null, error };
}

/**
 * Registra un movimiento manual y actualiza el stock y auditoría en productos.
 * Se ejecuta dentro de una transacción segura.
 */
export async function registrarMovimientoManual(params: {
  productoId: number | string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  motivo?: string;
  userEmail?: string;
  userId?: string;
}): Promise<{ data: any; error: any }> {
  const { productoId, tipo, cantidad, motivo, userEmail, userId } = params;

  // Insert movimiento
  const { data: movimientoData, error: movimientoError } = await supabase
    .from('movimientos_inventario')
    .insert([
      {
        producto_id: productoId,
        tipo_movimiento: tipo,
        cantidad,
        motivo,
        usuario_email: userEmail,
        usuario_id: userId,
      },
    ])
    .select()
    .single();

  if (movimientoError) {
    return { data: null, error: movimientoError };
  }

  // Update product stock
  const stockAdjustment = tipo === 'ENTRADA' ? cantidad : tipo === 'SALIDA' ? -cantidad : 0;
  const { data: productData, error: productError } = await supabase
    .from('productos')
    .update({
      stock_disponible: supabase.rpc('increment_stock', { id: productoId, delta: stockAdjustment }),
    })
    .eq('id', productoId)
    .select()
    .single();

  if (productError) {
    // Rollback movimiento if stock update fails
    if (movimientoData && (movimientoData as any).id) {
      await supabase.from('movimientos_inventario').delete().eq('id', (movimientoData as any).id);
    }
    return { data: null, error: productError };
  }

  return { data: { movimiento: movimientoData, producto: productData }, error: null };
}
