import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { syncService } from '../sync/syncService';
import { db } from '../db/schema';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook pour la synchronisation automatique
 *
 * Gère:
 * - Sync au retour online
 * - Sync périodique (5 min)
 * - Sync au retour de background (Page Visibility API)
 */
export function useAutoSync() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const syncInProgress = useRef(false);

  // 1. Sync au retour online
  useEffect(() => {
    if (!isOnline || syncInProgress.current) return;

    const syncOnOnline = async () => {
      const pendingCount = await db.syncQueue.count();

      if (pendingCount === 0) {
        console.log('[useAutoSync] No pending items to sync');
        return;
      }

      console.log(`[useAutoSync] Syncing ${pendingCount} items...`);
      toast.info(`Synchronisation de ${pendingCount} élément${pendingCount > 1 ? 's' : ''}...`, {
        duration: 2000
      });

      syncInProgress.current = true;

      try {
        const result = await syncService.fullSync();

        // Rafraîchir les queries après sync
        queryClient.invalidateQueries();

        // Agréger les stats de tous les push (patients + consultations + vaccinations)
        const totalSuccess = result.pushPatients.stats.success +
                            result.pushConsultations.stats.success +
                            result.pushVaccinations.stats.success;
        const totalConflicts = result.pushPatients.stats.conflicts +
                              result.pushConsultations.stats.conflicts +
                              result.pushVaccinations.stats.conflicts;
        const totalErrors = result.pushPatients.stats.errors +
                           result.pushConsultations.stats.errors +
                           result.pushVaccinations.stats.errors;

        if (totalSuccess > 0) {
          toast.success(
            `✅ ${totalSuccess} élément${totalSuccess > 1 ? 's' : ''} synchronisé${totalSuccess > 1 ? 's' : ''}`,
            { duration: 3000 }
          );
        }

        if (totalConflicts > 0) {
          toast.warning(
            `⚠️ ${totalConflicts} conflit${totalConflicts > 1 ? 's' : ''} détecté${totalConflicts > 1 ? 's' : ''}`,
            {
              duration: 5000,
              action: {
                label: 'Voir',
                onClick: () => {
                  // TODO: Ouvrir dialog de résolution de conflits
                  console.log('Conflicts:', syncService.getConflicts());
                }
              }
            }
          );
        }

        if (totalErrors > 0) {
          toast.error(
            `❌ ${totalErrors} erreur${totalErrors > 1 ? 's' : ''} de synchronisation`,
            { duration: 5000 }
          );
        }

      } catch (error: any) {
        console.error('[useAutoSync] Sync failed:', error);

        // Diagnostic détaillé de l'erreur
        if (error.code === 'ERR_NETWORK' || error.code === 'ERR_NAME_NOT_RESOLVED') {
          toast.error('Pas de connexion Internet - Synchronisation impossible', {
            description: 'Vérifiez votre connexion et réessayez',
            duration: 5000
          });
        } else if (error.message?.includes('timeout')) {
          toast.error('Délai dépassé - Connexion trop lente', {
            description: 'La synchronisation sera réessayée automatiquement',
            duration: 5000
          });
        } else {
          toast.error('Échec de la synchronisation', {
            description: error.message || 'Erreur inconnue',
            duration: 3000
          });
        }
      } finally {
        syncInProgress.current = false;
      }
    };

    // Délai de 1 seconde après passage en ligne
    const timer = setTimeout(syncOnOnline, 1000);
    return () => clearTimeout(timer);

  }, [isOnline, queryClient]);

  // 2. Auto-sync périodique (5 minutes) si online
  useEffect(() => {
    if (!isOnline) return;

    const intervalId = setInterval(async () => {
      if (syncInProgress.current) return;

      console.log('[useAutoSync] Periodic sync...');

      try {
        await syncService.pullChanges();
        queryClient.invalidateQueries();
      } catch (error) {
        console.error('[useAutoSync] Periodic pull failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [isOnline, queryClient]);

  // 3. Sync au retour de background (Page Visibility API)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden || !isOnline || syncInProgress.current) return;

      console.log('[useAutoSync] Page visible again, pulling changes...');

      try {
        await syncService.pullChanges();
        queryClient.invalidateQueries();
      } catch (error) {
        console.error('[useAutoSync] Visibility pull failed:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOnline, queryClient]);

  // 4. Exposer méthode de sync manuel
  const manualSync = async () => {
    if (syncInProgress.current) {
      toast.info('Synchronisation déjà en cours...', { duration: 2000 });
      return;
    }

    syncInProgress.current = true;

    try {
      toast.info('Synchronisation en cours...', { duration: 1000 });
      const result = await syncService.fullSync();
      queryClient.invalidateQueries();

      toast.success('✅ Synchronisation terminée', { duration: 2000 });
      return result;
    } catch (error: any) {
      toast.error('❌ Erreur de synchronisation', { duration: 3000 });
      throw error;
    } finally {
      syncInProgress.current = false;
    }
  };

  return {
    manualSync,
    syncInProgress: syncInProgress.current
  };
}
