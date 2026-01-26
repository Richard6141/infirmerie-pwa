import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from './useOnlineStatus';
import {
  getCreneauxBloques,
  getCreneauxBloquesActifs,
  createCreneauBloque,
  deleteCreneauBloque,
} from '../api/creneaux-bloques';


export const creneauxBloquesKeys = {
  all: ['creneaux-bloques'] as const,
  list: () => [...creneauxBloquesKeys.all, 'list'] as const,
  active: () => [...creneauxBloquesKeys.all, 'active'] as const,
};

/**
 * Hook pour récupérer tous les créneaux bloqués
 */
export function useCreneauxBloques() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: creneauxBloquesKeys.list(),
    queryFn: getCreneauxBloques,
    enabled: isOnline,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook pour récupérer les créneaux bloqués actifs
 */
export function useCreneauxBloquesActifs() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: creneauxBloquesKeys.active(),
    queryFn: getCreneauxBloquesActifs,
    enabled: isOnline,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook pour créer un créneau bloqué
 */
export function useCreateCreneauBloque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCreneauBloque,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxBloquesKeys.all });
    },
  });
}

/**
 * Hook pour supprimer un créneau bloqué
 */
export function useDeleteCreneauBloque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCreneauBloque,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creneauxBloquesKeys.all });
    },
  });
}
