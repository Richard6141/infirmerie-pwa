import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useOnlineStatus } from './useOnlineStatus';
import type {
  ReposSanitaire,
  ReposSanitaireResponse,
  ReposSanitaireFilters,
  CreateReposSanitaireData,
  UpdateReposSanitaireData,
} from '@/types/repos-sanitaire';

// Query keys pour invalidation cache
export const reposSanitaireKeys = {
  all: ['repos-sanitaire'] as const,
  lists: () => [...reposSanitaireKeys.all, 'list'] as const,
  list: (filters: ReposSanitaireFilters) =>
    [...reposSanitaireKeys.lists(), filters] as const,
  details: () => [...reposSanitaireKeys.all, 'detail'] as const,
  detail: (id: string) => [...reposSanitaireKeys.details(), id] as const,
  byPatient: (patientId: string) =>
    [...reposSanitaireKeys.all, 'patient', patientId] as const,
};

/**
 * Hook pour récupérer la liste des fiches de repos sanitaire avec filtres
 */
export function useReposSanitaire(filters: ReposSanitaireFilters = {}) {
  const isOnline = useOnlineStatus();

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([_, value]) => value !== undefined && value !== '',
    ),
  ) as ReposSanitaireFilters;

  return useQuery({
    queryKey: reposSanitaireKeys.list(cleanFilters),
    enabled: isOnline,
    queryFn: async (): Promise<ReposSanitaireResponse> => {
      const params = new URLSearchParams();
      if (cleanFilters.search) params.append('search', cleanFilters.search);
      if (cleanFilters.startDate)
        params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
      if (cleanFilters.limit)
        params.append('limit', cleanFilters.limit.toString());

      const url =
        '/repos-sanitaire' + (params.toString() ? '?' + params.toString() : '');
      const { data } = await api.get<ReposSanitaireResponse>(url);
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook pour récupérer une fiche de repos sanitaire par ID
 */
export function useReposSanitaireDetail(id: string) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: reposSanitaireKeys.detail(id),
    queryFn: async (): Promise<ReposSanitaire> => {
      const { data } = await api.get<ReposSanitaire>(
        '/repos-sanitaire/' + id,
      );
      return data;
    },
    enabled: !!id && isOnline,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook pour récupérer toutes les fiches d'un patient
 */
export function useReposSanitaireByPatient(patientId: string) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: reposSanitaireKeys.byPatient(patientId),
    queryFn: async (): Promise<ReposSanitaire[]> => {
      const { data } = await api.get<ReposSanitaire[]>(
        '/repos-sanitaire/patient/' + patientId,
      );
      return data;
    },
    enabled: !!patientId && isOnline,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook pour créer une nouvelle fiche de repos sanitaire
 */
export function useCreateReposSanitaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateReposSanitaireData,
    ): Promise<ReposSanitaire> => {
      const response = await api.post<ReposSanitaire>(
        '/repos-sanitaire',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalider toutes les listes pour forcer le rechargement
      queryClient.invalidateQueries({
        queryKey: reposSanitaireKeys.lists(),
      });
    },
  });
}

/**
 * Hook pour mettre à jour une fiche de repos sanitaire
 */
export function useUpdateReposSanitaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReposSanitaireData;
    }): Promise<ReposSanitaire> => {
      const response = await api.patch<ReposSanitaire>(
        '/repos-sanitaire/' + id,
        data,
      );
      return response.data;
    },
    onSuccess: (updated) => {
      // Invalider les listes et le détail
      queryClient.invalidateQueries({
        queryKey: reposSanitaireKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: reposSanitaireKeys.detail(updated.id),
      });
      // Si patientId est disponible, invalider aussi les fiches du patient
      if (updated.patientId) {
        queryClient.invalidateQueries({
          queryKey: reposSanitaireKeys.byPatient(updated.patientId),
        });
      }
    },
  });
}

/**
 * Hook pour supprimer une fiche de repos sanitaire
 */
export function useDeleteReposSanitaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete('/repos-sanitaire/' + id);
    },
    onSuccess: () => {
      // Invalider toutes les queries liées aux fiches de repos sanitaire
      queryClient.invalidateQueries({
        queryKey: reposSanitaireKeys.all,
      });
    },
  });
}
