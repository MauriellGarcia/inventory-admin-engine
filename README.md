# 📦 Sistema de Inventario y Kardex

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

Una aplicación profesional para el control de inventarios y gestión de Kardex, diseñada para ofrecer trazabilidad total de movimientos de productos en tiempo real.

---

## 🚀 Demo en Vivo
Puedes ver la aplicación en funcionamiento aquí: [[Sustituir con tu enlace de Vercel](https://tu-proyecto.vercel.app)](https://inventory-admin-engine.vercel.app/)

---

## ✨ Características Principales

- **📦 CRUD Completo de Productos:** Gestión detallada de catálogo con SKU, descripción, precios y stock mínimo.
- **📁 Categorías:** Clasificación organizada de productos para una mejor navegación y filtrado.
- **📉 Kardex en Tiempo Real:** Historial detallado de todas las entradas y salidas, permitiendo una trazabilidad exacta por producto.
- **🔧 Ajustes Manuales:** Funcionalidad para corregir inventarios mediante ajustes de entrada o salida con justificación.
- **🔐 Auth & RLS:** Autenticación robusta mediante Supabase Auth y seguridad a nivel de fila (Row Level Security) para proteger los datos.
- **📱 Interfaz Responsive:** Diseño moderno y adaptativo utilizando Tailwind CSS.

---

## 🛠️ Stack Técnico y Arquitectura

- **Frontend:** React 18 con Vite para un desarrollo ultra rápido.
- **Lenguaje:** TypeScript para un código tipado y seguro.
- **Estilos:** Tailwind CSS con componentes de UI modernos.
- **Backend-as-a-Service:** Supabase (Base de datos PostgreSQL, Auth, y Realtime).
- **Gestión de Estado:** Hooks de React y Context API (o librerías de estado según implementación).
- **Iconografía:** Lucide React.

---

## 📊 Esquema de Base de Datos

El sistema se basa en un esquema relacional optimizado en PostgreSQL:

### Tablas Principales:
- **`categorias`**: Almacena las categorías de los productos.
  - `id`, `nombre`, `descripcion`, `created_at`.
- **`productos`**: Catálogo maestro de artículos.
  - `id`, `nombre`, `sku`, `precio_compra`, `precio_venta`, `stock_actual`, `stock_minimo`, `categoria_id`.
- **`movimientos_inventario`**: Registro histórico (Kardex).
  - `id`, `producto_id`, `tipo` (Entrada/Salida/Ajuste), `cantidad`, `motivo`, `fecha`.

---

## ⚙️ Instalación Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   cd tu-repositorio
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
Desarrollado con ❤️ por [Tu Nombre/Equipo]
