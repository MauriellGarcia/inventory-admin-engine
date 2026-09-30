export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at?: string;
}

export interface Producto {
  id: number; // BIGINT en Supabase
  nombre: string;
  sku: string;
  precio: number;
  stock_disponible: number;
  categoria_id?: string;
  categorias?: Categoria; // Para el JOIN de Supabase
  created_at?: string;
}

export interface MovimientoInventario {
  id: string;
  producto_id: number | string;
  producto?: Partial<Producto> | null;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string | null;
  referencia?: string | null;
  usuario_id?: string | null;
  created_at?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: Categoria;
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      productos: {
        Row: {
          id: number;
          nombre: string;
          sku: string;
          precio: number;
          stock_disponible: number;
          categoria_id?: string;
          created_at?: string;
        };
        Insert: {
          id?: number;
          nombre: string;
          sku: string;
          precio: number;
          stock_disponible: number;
          categoria_id?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          nombre?: string;
          sku?: string;
          precio?: number;
          stock_disponible?: number;
          categoria_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      movimientos_inventario: {
        Row: {
          id: string;
          producto_id: number | string;
          tipo: TipoMovimiento;
          cantidad: number;
          motivo?: string;
          referencia?: string;
          usuario_id?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          producto_id: number | string;
          tipo: TipoMovimiento;
          cantidad: number;
          motivo?: string;
          referencia?: string;
          usuario_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          producto_id?: number | string;
          tipo?: TipoMovimiento;
          cantidad?: number;
          motivo?: string;
          referencia?: string;
          usuario_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};





