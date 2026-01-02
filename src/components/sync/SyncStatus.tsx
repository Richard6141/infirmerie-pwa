import { useEffect, useState } from 'react';
import { Cloud, CloudOff, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { getSyncMeta } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

type SyncState = 'synced' | 'syncing' | 'error' | 'never' | 'offline';

interface SyncStatusData {
  lastSyncDate?: string;
  syncInProgress?: boolean;
  pendingOperationsCount?: number;
  lastError?: string;
}

export function SyncStatus() {
  const isOnline = useOnlineStatus();
  const [syncData, setSyncData] = useState<SyncStatusData>({});
  const [syncState, setSyncState] = useState<SyncState>('never');

  useEffect(() => {
    const loadSyncMeta = async () => {
      try {
        const lastSyncDate = await getSyncMeta('lastSyncDate');
        const syncInProgress = await getSyncMeta('syncInProgress');
        const pendingOperationsCount = await getSyncMeta('pendingOperationsCount') || 0;
        const lastError = await getSyncMeta('lastError');

        setSyncData({
          lastSyncDate,
          syncInProgress,
          pendingOperationsCount,
          lastError
        });

        if (!isOnline) {
          setSyncState('offline');
        } else if (syncInProgress) {
          setSyncState('syncing');
        } else if (lastError) {
          setSyncState('error');
        } else if (lastSyncDate) {
          setSyncState('synced');
        } else {
          setSyncState('never');
        }
      } catch (error) {
        console.error('Error loading sync meta:', error);
      }
    };

    loadSyncMeta();
    const interval = setInterval(loadSyncMeta, 10000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const getStatusIcon = () => {
    switch (syncState) {
      case 'synced':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'syncing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'offline':
        return <CloudOff className="h-5 w-5 text-slate-400" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncState) {
      case 'synced':
        return 'Synchronisé';
      case 'syncing':
        return 'Synchronisation en cours...';
      case 'error':
        return 'Erreur de synchronisation';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Jamais synchronisé';
    }
  };

  const getStatusColor = () => {
    switch (syncState) {
      case 'synced':
        return 'text-success';
      case 'syncing':
        return 'text-primary';
      case 'error':
        return 'text-destructive';
      case 'offline':
        return 'text-slate-500';
      default:
        return 'text-slate-500';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "à l'instant";
    if (diffMins < 60) return `il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays}j`;
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className={cn('text-sm font-semibold', getStatusColor())}>
                {getStatusText()}
              </p>
              {syncData.lastSyncDate && syncState === 'synced' && (
                <p className="text-xs text-slate-500">
                  Dernière sync: {formatRelativeTime(syncData.lastSyncDate)}
                </p>
              )}
              {syncState === 'error' && syncData.lastError && (
                <p className="text-xs text-destructive mt-0.5">{syncData.lastError}</p>
              )}
            </div>
          </div>

          {syncData.pendingOperationsCount !== undefined && syncData.pendingOperationsCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-semibold text-warning">
                {syncData.pendingOperationsCount} en attente
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SyncStatusCompact() {
  const isOnline = useOnlineStatus();
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadSyncData = async () => {
      const date = await getSyncMeta('lastSyncDate');
      const count = await getSyncMeta('pendingOperationsCount') || 0;
      setLastSyncDate(date);
      setPendingCount(count);
    };

    loadSyncData();
    const interval = setInterval(loadSyncData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
      {isOnline ? (
        <Cloud className="h-4 w-4 text-primary" />
      ) : (
        <CloudOff className="h-4 w-4 text-slate-400" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700">
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </p>
        {lastSyncDate && (
          <p className="text-[10px] text-slate-500 truncate">
            Sync: {new Date(lastSyncDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {pendingCount > 0 && (
        <span className="flex items-center justify-center h-5 w-5 text-[10px] font-bold text-white bg-warning rounded-full">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </div>
  );
}
