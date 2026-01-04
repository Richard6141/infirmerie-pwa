import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ConflictResolutionDialog } from '@/components/sync';
import { useAutoSync } from '@/lib/hooks/useAutoSync';
import { useConflicts } from '@/lib/hooks/useConflicts';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  // Activer la synchronisation automatique
  useAutoSync();

  // Gérer les conflits
  const { hasConflicts, conflicts } = useConflicts();

  // Ouvrir automatiquement le dialogue quand des conflits sont détectés
  useEffect(() => {
    if (hasConflicts && !conflictDialogOpen) {
      setConflictDialogOpen(true);
    } else if (!hasConflicts && conflictDialogOpen) {
      setConflictDialogOpen(false);
    }
  }, [hasConflicts, conflictDialogOpen]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - Fixed */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content wrapper */}
      <div className="lg:pl-64">
        {/* Header - Sticky at top */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page content - Scrollable */}
        <main className="min-h-screen">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white mt-12">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-6 w-6 rounded gradient-primary flex items-center justify-center">
                    <span className="text-white font-bold text-xs">+</span>
                  </div>
                  <span className="font-semibold">Infirmerie MDC</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">Version 1.0.0</span>
                </div>
                <div className="text-xs text-slate-500">
                  © 2024 Ministère. Tous droits réservés.
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Dialogue de résolution des conflits */}
      <ConflictResolutionDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
      />
    </div>
  );
}