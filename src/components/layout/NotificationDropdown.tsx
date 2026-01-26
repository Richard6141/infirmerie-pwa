import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Calendar, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/lib/hooks/useNotifications';
import type { NotificationInApp } from '@/types/notification';

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  NOUVEAU_RDV: Calendar,
  RDV_ANNULE: X,
  RDV_MODIFIE: Calendar,
  RAPPEL: Bell,
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications, isLoading } = useNotifications(20);
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadData?.count || 0;

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: NotificationInApp) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                  const rdvId = notification.metadata?.rendezVousId;

                  return (
                    <li key={notification.id}>
                      {rdvId ? (
                        <Link
                          to={`/rendez-vous/${rdvId}`}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'flex gap-3 p-4 hover:bg-slate-50 transition-colors',
                            !notification.isRead && 'bg-blue-50/50'
                          )}
                        >
                          <NotificationContent
                            notification={notification}
                            Icon={Icon}
                          />
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'flex gap-3 p-4 w-full text-left hover:bg-slate-50 transition-colors',
                            !notification.isRead && 'bg-blue-50/50'
                          )}
                        >
                          <NotificationContent
                            notification={notification}
                            Icon={Icon}
                          />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationContent({
  notification,
  Icon,
}: {
  notification: NotificationInApp;
  Icon: React.ElementType;
}) {
  return (
    <>
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          {
            'bg-green-100 text-green-600': notification.type === 'NOUVEAU_RDV',
            'bg-red-100 text-red-600': notification.type === 'RDV_ANNULE',
            'bg-blue-100 text-blue-600': notification.type === 'RDV_MODIFIE',
            'bg-yellow-100 text-yellow-600': notification.type === 'RAPPEL',
          }
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {notification.titre}
        </p>
        <p className="text-sm text-slate-600 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
      )}
    </>
  );
}
