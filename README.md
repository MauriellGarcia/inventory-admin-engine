# 📦 Sistema de Inventario y Kardex (ERP Engine)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

Una aplicación profesional de nivel empresarial para el control de inventarios, gestión de Kardex y catálogo de productos, diseñada bajo **Arquitectura Basada en Dominios (`src/features/`)**, desacoplamiento de servicios de datos y persistencia atómica en PostgreSQL.

---

## 🚀 Demo en Vivo
Puedes ver la aplicación en funcionamiento aquí: [inventory-admin-engine.vercel.app](https://inventory-admin-engine.vercel.app/)

---

## ✨ Características Principales

- **📦 CRUD Completo de Productos & SKU Automático:** Gestión de catálogo con asignación de SKU consecutivo autogenerado en tiempo real según la categoría seleccionada (ej. `JUGU-0001`).
- **📁 Categorías & Previsualización de Prefijo:** Clasificación organizada con cálculo de prefijos taxonómicos únicos (primeras 4 letras) en tiempo de creación.
- **📉 Kardex en Tiempo Real:** Historial detallado de Entradas, Salidas y Ajustes con trazabilidad exacta y auditoría por usuario.
- **🔧 Ajustes Manuales de Stock:** Funcionalidad para corregir inventarios con justificación y actualización atómica del catálogo.
- **🔐 Auth & RLS:** Autenticación mediante Supabase Auth y seguridad a nivel de fila (Row Level Security) para proteger la información.
- **🔍 Búsqueda Global & Filtros Sincronizados:** Filtrado dinámico por texto (nombre/SKU) y categoría compartido entre el Navbar y las vistas operativas.
- **📱 Interfaz Responsive:** Diseño moderno y adaptativo utilizando Tailwind CSS con modales accesibles.

---

## 🛠️ Stack Técnico y Arquitectura

- **Frontend:** React 18 con Vite para un empaquetado y desarrollo de alta velocidad.
- **Arquitectura de Software:** Modular orientada a características/dominios (`src/features/`) con capas de servicios desacopladas (`categoryService`, `inventoryService`, `productService`).
- **Lenguaje:** TypeScript 5 para un tipado estricto e interfaces seguras.
- **Estilos:** Tailwind CSS con componentes y modales UI personalizados.
- **Backend-as-a-Service:** Supabase (Base de datos PostgreSQL, Auth, PL/pgSQL RPCs).
- **Iconografía:** Lucide React.

---

## 📐 Estructura del Proyecto

```text
src/
├── features/               # Dominios de negocio aislados
│   ├── auth/              # Control de inicio de sesión y sesión activa
│   ├── categories/        # Gestión de categorías, prefijos y modales
│   ├── dashboard/         # Indicadores KPI y métricas generales
│   ├── inventory/         # Kardex de movimientos y auditoría de stock
│   └── products/          # Catálogo maestro y asignación automática de SKU
├── components/            # UI global compartida (Layout, Navbar, Sidebar, Modal)
├── lib/                   # Cliente y configuración global de Supabase
└── types/                 # Definiciones e interfaces TypeScript
```

---

## 📊 Esquema de Base de Datos y Funciones Atómicas

El sistema se basa en un esquema relacional optimizado en PostgreSQL con lógica transaccional en servidor:

### Tablas Principales:
- **`categorias`**: Almacena las familias de productos y el control de consecutivos.
  - `id` (uuid), `nombre`, `descripcion`, `prefijo` (text, unique), `ultimo_consecutivo` (integer), `created_at`.
- **`productos`**: Catálogo maestro de artículos.
  - `id` (bigint/serial), `nombre`, `sku` (text, unique), `precio`, `stock_disponible`, `categoria_id` (uuid), `id_ultimo_mov_inv`, `modificado_por`, `modificado_el`.
- **`movimientos_inventario`**: Registro histórico (Kardex).
  - `id` (bigint/serial), `producto_id`, `tipo_movimiento` (`ENTRADA` | `SALIDA` | `AJUSTE`), `cantidad`, `motivo`, `usuario_email`, `created_at`.

### ⚙️ Lógica de Ingeniería: Autogeneración Consecutiva de SKU (RPC)
Para prevenir condiciones de carrera (*race conditions*) y asegurar la unicidad de los SKUs al crear productos en entornos concurrentes, la generación se ejecuta en una función PL/pgSQL atómica:

```sql
CREATE OR REPLACE FUNCTION public.generar_siguiente_sku(p_categoria_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_prefijo text;
  v_siguiente_num integer;
  v_sku text;
BEGIN
  -- Incrementar el consecutivo de la categoría de manera atómica
  UPDATE public.categorias
  SET ultimo_consecutivo = ultimo_consecutivo + 1
  WHERE id = p_categoria_id
  RETURNING prefijo, ultimo_consecutivo INTO v_prefijo, v_siguiente_num;

  IF v_prefijo IS NULL THEN
    RAISE EXCEPTION 'La categoría seleccionada no existe o no tiene un prefijo configurado.';
  END IF;

  -- Formatear SKU con padding numérico a 4 dígitos (Ej. COSM-0001)
  v_sku := concat(v_prefijo, '-', lpad(v_siguiente_num::text, 4, '0'));

  RETURN v_sku;
END;
$function$;
```

---

## ⚙️ Instalación Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/MauriellGarcia/inventory-admin-engine.git
   cd inventory-admin-engine
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

## 📄 Licencia
Este proyecto está bajo la Licencia MIT.

---
Desarrollado por [Mauriell García (Mau)](https://github.com/MauriellGarcia)