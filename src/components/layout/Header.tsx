import { Menu, LogOut, User, Search, Bell, MessageSquare, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnlineIndicator } from '@/components/sync/OnlineIndicator';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 w-full h-16 bg-white border-b border-slate-200 shadow-header">
      <div className="flex h-full items-center px-4 md:px-6 gap-3 md:gap-4">
        {/* Menu burger pour mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-700 hover:bg-slate-100"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo Medicare (visible sur desktop) */}
        <div className="hidden lg:flex items-center gap-2 mr-4">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">+</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-800 leading-tight">Infirmerie MDC</span>
            <span className="text-[10px] text-slate-500 leading-tight">Bénin - Action Gouvernementale</span>
          </div>
        </div>

        {/* Barre de recherche centrale */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher patients, consultations..."
              className="w-full pl-10 pr-4 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary focus-visible:ring-1 focus-visible:ring-primary rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Icons à droite */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Indicateur online/offline */}
          <div className="hidden md:block">
            <OnlineIndicator />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-primary hover:bg-primary/10 relative h-10 w-10 rounded-lg"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full ring-2 ring-white"></span>
          </Button>

          {/* Messages */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-slate-600 hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-lg"
            title="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-slate-600 hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-lg"
            title="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Profile Dropdown */}
          <div className="hidden md:flex items-center gap-2 ml-2 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-smooth border border-slate-200">
            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-xs max-w-[120px]">
              <p className="font-semibold text-slate-700 truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {user?.role === 'INFIRMIER' ? 'Infirmier' : 'Personnel'}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>

          {/* Mobile User Icon */}
          <div className="md:hidden h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Déconnexion"
            className="text-slate-600 hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-lg cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}