import { useState, useEffect } from 'react';
import { syncService, type SyncConflict } from '../sync/syncService';
import { toast } from 'sonner';

/**
 * Hook pour gérer les conflits de synchronisation
 *
 * Expose:
 * - Liste des conflits
 * - Fonction de résolution
 * - État de chargement
 */
export function useConflicts() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  // Récupérer les conflits depuis syncService
  const refreshConflicts = () => {
    const currentConflicts = syncService.getConflicts();
    setConflicts(currentConflicts);
  };

  // Initialiser et écouter les changements
  useEffect(() => {
    refreshConflicts();

    // Vérifier périodiquement (toutes les 3 secondes)
    const interval = setInterval(refreshConflicts, 3000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Résoudre un conflit
   * @param tempId - ID temporaire du conflit
   * @param resolution - 'client' pour garder version locale, 'server' pour accepter version serveur
   */
  const resolveConflict = async (tempId: string, resolution: 'client' | 'server') => {
    setIsResolving(true);

    try {
      await syncService.resolveConflict(tempId, resolution);

      // Rafraîchir la liste
      refreshConflicts();

      toast.success(
        resolution === 'client'
          ? '✅ Votre version a été conservée'
          : '✅ Version serveur acceptée',
        { duration: 2000 }
      );

    } catch (error: any) {
      console.error('[useConflicts] Resolution error:', error);
      toast.error(error?.message || 'Erreur lors de la résolution du conflit');
    } finally {
      setIsResolving(false);
    }
  };

  /**
   * Résoudre tous les conflits avec la même stratégie
   */
  const resolveAllConflicts = async (resolution: 'client' | 'server') => {
    setIsResolving(true);

    try {
      for (const conflict of conflicts) {
        await syncService.resolveConflict(conflict.tempId, resolution);
      }

      refreshConflicts();

      toast.success(
        `✅ ${conflicts.length} conflit${conflicts.length > 1 ? 's' : ''} résolu${conflicts.length > 1 ? 's' : ''}`,
        { duration: 3000 }
      );

    } catch (error: any) {
      console.error('[useConflicts] Batch resolution error:', error);
      toast.error('Erreur lors de la résolution des conflits');
    } finally {
      setIsResolving(false);
    }
  };

  /**
   * Effacer tous les conflits (sans résolution)
   */
  const clearConflicts = async () => {
    await syncService.clearConflicts();
    refreshConflicts();
  };

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
    resolveConflict,
    resolveAllConflicts,
    clearConflicts,
    isResolving,
    refreshConflicts
  };
}
