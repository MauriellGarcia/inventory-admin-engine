import { Bell, Search, ShieldCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  title?: string;
  userEmail?: string;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = 'ERP Inventario - Admin',
  userEmail = 'admin@inventario.erp',
  onSignOut,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Gestión centralizada de stock y operaciones
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar SKU, producto..."
            className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Info */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
              Admin General
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span className="text-[11px] text-slate-500 truncate max-w-[140px] block" title={userEmail}>
              {userEmail}
            </span>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar sesión"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
