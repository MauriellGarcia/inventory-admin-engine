import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Layout, type NavigationTab } from './components';
import {
  Login,
  DashboardPage,
  ProductosPage,
  CategoriasPage,
  MovimientosPage,
} from './pages';
import { Loader2 } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  useEffect(() => {
    // 1. Obtener la sesión inicial activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios de estado en tiempo real (SIGNED_IN, SIGNED_OUT, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Pantalla de carga mientras se verifica la sesión en Supabase
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium tracking-wide">Cargando ERP Engine...</p>
      </div>
    );
  }

  // Si no hay sesión iniciada, mostrar únicamente el formulario de Login
  if (!session) {
    return <Login />;
  }

  // Renderizado modular de las vistas principales
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'productos':
        return <ProductosPage />;
      case 'categorias':
        return <CategoriasPage />;
      case 'movimientos':
        return <MovimientosPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      userEmail={session.user.email || 'usuario@erp.com'}
      onSignOut={handleSignOut}
      title="ERP Inventario - Admin"
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
