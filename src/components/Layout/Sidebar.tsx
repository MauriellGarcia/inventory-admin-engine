import React from 'react';
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowLeftRight,
  Settings,
  Database as DbIcon,
  LogOut,
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'productos' | 'categorias' | 'movimientos';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onSignOut }) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'categorias', label: 'Categorías', icon: Tags },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-500/30">
          <DbIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-sm tracking-wide">ERP Engine</div>
          <div className="text-[11px] text-slate-400">v1.0.0 • Supabase + Tailwind 4</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Módulos Principales
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Sistema
        </div>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Configuración</span>
        </button>
      </div>

      {/* Footer / User Session */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
