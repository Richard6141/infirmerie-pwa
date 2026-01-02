import { useState, useEffect } from 'react';
import { CloudOff, Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { syncService } from '@/lib/sync/syncService';
import { db } from '@/lib/db/schema';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  onSync?: () => Promise<void>;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

/**
 * Bouton de synchronisation avec indicateur de progression
 *
 * Déclenche la synchronisation manuelle des données avec le serveur
 * Affiche un état de chargement pendant la synchronisation
 */
export function SyncButton({
  onSync,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true
}: SyncButtonProps) {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Récupérer le nombre d'items en attente
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await db.syncQueue.count();
      setPendingCount(count);
    };

    updatePendingCount();

    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Impossible de synchroniser hors ligne');
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);

    try {
      if (onSync) {
        await onSync();
      } else {
        // Utiliser syncService pour synchronisation complète
        const result = await syncService.fullSync();

        // Mettre à jour le compteur
        setPendingCount(await db.syncQueue.count());

        // Agréger les stats
        const totalSuccess = result.pushPatients.stats.success +
                            result.pushConsultations.stats.success +
                            result.pushVaccinations.stats.success;
        const totalConflicts = result.pushPatients.stats.conflicts +
                              result.pushConsultations.stats.conflicts +
                              result.pushVaccinations.stats.conflicts;
        const totalErrors = result.pushPatients.stats.errors +
                           result.pushConsultations.stats.errors +
                           result.pushVaccinations.stats.errors;
        const totalPull = result.pull.stats.consultations.updated +
                         result.pull.stats.vaccinations.updated +
                         result.pull.stats.rendezVous.updated;

        if (totalSuccess > 0) {
          toast.success(`✅ ${totalSuccess} élément${totalSuccess > 1 ? 's' : ''} synchronisé${totalSuccess > 1 ? 's' : ''}`);
        }

        if (totalConflicts > 0) {
          toast.warning(`⚠️ ${totalConflicts} conflit${totalConflicts > 1 ? 's' : ''} détecté${totalConflicts > 1 ? 's' : ''}`);
        }

        if (totalErrors > 0) {
          toast.error(`❌ ${totalErrors} erreur${totalErrors > 1 ? 's' : ''}`);
        }

        if (totalSuccess === 0 && totalPull === 0) {
          toast.success('✅ Déjà à jour');
        }
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error?.message || 'Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={!isOnline || isSyncing}
        className={cn(
          'transition-all',
          !isOnline && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={isOnline ? 'Synchroniser les données' : 'Hors ligne - Synchronisation impossible'}
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {showLabel && size !== 'icon' && <span className="ml-2">Synchronisation...</span>}
          </>
        ) : isOnline ? (
          <>
            <RefreshCw className="h-4 w-4" />
            {showLabel && size !== 'icon' && <span className="ml-2">Synchroniser</span>}
          </>
        ) : (
          <>
            <CloudOff className="h-4 w-4" />
            {showLabel && size !== 'icon' && <span className="ml-2">Hors ligne</span>}
          </>
        )}
      </Button>

      {/* Badge compteur pending */}
      {pendingCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center px-1 text-xs font-bold animate-pulse"
        >
          {pendingCount > 99 ? '99+' : pendingCount}
        </Badge>
      )}
    </div>
  );
}

/**
 * Version compacte avec icône uniquement
 */
export function SyncButtonIcon(props: Omit<SyncButtonProps, 'showLabel' | 'size'>) {
  return <SyncButton {...props} size="icon" showLabel={false} />;
}

/**
 * Version avec progression détaillée
 */
interface SyncButtonWithProgressProps extends SyncButtonProps {
  progress?: number; // 0-100
  totalItems?: number;
  syncedItems?: number;
}

export function SyncButtonWithProgress({
  progress = 0,
  totalItems,
  syncedItems,
  ...props
}: SyncButtonWithProgressProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex flex-col gap-2">
      <SyncButton {...props} />

      {props.onSync && totalItems && syncedItems !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Progression</span>
            <span>{syncedItems}/{totalItems}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isOnline ? "bg-primary" : "bg-slate-400"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
