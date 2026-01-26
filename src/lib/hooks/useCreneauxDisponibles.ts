import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useOnlineStatus } from './useOnlineStatus';
import type { CreneauxDisponiblesResponse } from '@/types/creneau';

export const creneauxKeys = {
  all: ['creneaux'] as const,
  disponibles: (date: string) => [...creneauxKeys.all, 'disponibles', date] as const,
};

/**
 * Hook pour récupérer les créneaux disponibles pour une date donnée
 */
export function useCreneauxDisponibles(date: string | null) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: creneauxKeys.disponibles(date || ''),
    queryFn: async (): Promise<CreneauxDisponiblesResponse> => {
      const { data } = await api.get<CreneauxDisponiblesResponse>(
        `/rendez-vous/creneaux-disponibles`,
        { params: { date } }
      );
      return data;
    },
    enabled: !!date && isOnline,
    staleTime: 1000 * 60 * 2, // 2 minutes - les créneaux peuvent changer rapidement
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
