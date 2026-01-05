import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  User,
  FileText,
  FileHeart,
  Pill,
  Package,
  Syringe,
  Calendar,
  BarChart,
  X,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Patients', roles: ['INFIRMIER'] },
  { to: '/consultations', icon: FileText, label: 'Consultations' },
  { to: '/repos-sanitaire', icon: FileHeart, label: 'Repos Sanitaire', roles: ['INFIRMIER'] },
  { to: '/medicaments', icon: Pill, label: 'Médicaments', roles: ['INFIRMIER'] },
  { to: '/stocks', icon: Package, label: 'Gestion Stocks', roles: ['INFIRMIER'] },
  { to: '/vaccinations', icon: Syringe, label: 'Vaccinations' },
  { to: '/rendez-vous', icon: Calendar, label: 'Rendez-vous' },
  { to: '/rapports', icon: BarChart, label: 'Rapports', roles: ['INFIRMIER'] },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  // Filtrer les items selon le rôle
  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixed position */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 shadow-lg lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Medicare Header */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">+</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-800 leading-tight">Infirmerie MDCAG</span>
                <span className="text-[10px] text-slate-500 leading-tight">Bénin - Action Gouvernementale</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info Card */}
          <div className="p-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shadow-md ring-2 ring-white">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle"></div>
                  <p className="text-xs text-slate-600">
                    {user?.role === 'INFIRMIER' ? 'Infirmier' : 'Personnel'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Navigation
            </div>
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    // Fermer la sidebar sur mobile après navigation
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
                      )}>
                        <Icon className={cn(
                          'h-4 w-4',
                          isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'
                        )} />
                      </div>
                      <span className={cn(
                        "flex-1",
                        isActive ? "text-white font-semibold" : ""
                      )}>{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Divider */}
            <div className="h-px bg-slate-200 my-4"></div>

            {/* Quick Stats */}
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-4">
              Statistiques
            </div>
            <div className="grid grid-cols-2 gap-2 px-3">
              <div className="p-2.5 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="h-3 w-3 text-success" />
                  <span className="text-[10px] font-medium text-slate-600">Actifs</span>
                </div>
                <p className="text-lg font-bold text-slate-800">0</p>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-slate-600">RDV</span>
                </div>
                <p className="text-lg font-bold text-slate-800">0</p>
              </div>
            </div>
          </nav>

          {/* Footer sidebar */}
          <div className="p-4 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 flex-shrink-0">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded gradient-primary flex items-center justify-center">
                  <Activity className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Système Actif</span>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p>Version <span className="font-semibold text-slate-700">1.0.0</span></p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}