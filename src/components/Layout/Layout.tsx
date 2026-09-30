import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar, type NavigationTab } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  title?: string;
  userEmail?: string;
  onSignOut?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onSelectTab,
  title = 'ERP Inventario - Admin',
  userEmail,
  onSignOut,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onSignOut={onSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={title}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
