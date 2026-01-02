import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Medicament,
  MedicamentFilters,
  MedicamentsResponse,
  CreateMedicamentData,
  UpdateMedicamentData,
} from '@/types/medicament';

// Query keys
export const medicamentKeys = {
  all: ['medicaments'] as const,
  lists: () => [...medicamentKeys.all, 'list'] as const,
  list: (filters: MedicamentFilters) => [...medicamentKeys.lists(), filters] as const,
  details: () => [...medicamentKeys.all, 'detail'] as const,
  detail: (id: string) => [...medicamentKeys.details(), id] as const,
};

// ==================== GET MEDICAMENTS (Liste avec filtres) ====================
export function useMedicaments(filters: MedicamentFilters = {}) {
  // Nettoyer les filtres (enlever undefined)
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined)
  ) as MedicamentFilters;

  return useQuery({
    queryKey: medicamentKeys.list(cleanFilters),
    queryFn: async (): Promise<MedicamentsResponse> => {
      const params = new URLSearchParams();

      if (cleanFilters.search) params.append('search', cleanFilters.search);
      if (cleanFilters.forme) params.append('forme', cleanFilters.forme);
      if (cleanFilters.stockBas) params.append('stockBas', 'true');
      if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
      if (cleanFilters.limit) params.append('limit', cleanFilters.limit.toString());

      const { data } = await api.get<MedicamentsResponse>(`/medicaments?${params.toString()}`);
      return data;
    },
    staleTime: 0, // Toujours refetch pour que les filtres fonctionnent
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== GET MEDICAMENT (Détail par ID) ====================
export function useMedicament(id: string | undefined) {
  return useQuery({
    queryKey: medicamentKeys.detail(id!),
    queryFn: async (): Promise<Medicament> => {
      const { data } = await api.get<Medicament>(`/medicaments/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== CREATE MEDICAMENT ====================
export function useCreateMedicament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medicamentData: CreateMedicamentData): Promise<Medicament> => {
      const { data } = await api.post<Medicament>('/medicaments', medicamentData);
      return data;
    },
    onSuccess: () => {
      // Invalider toutes les listes
      queryClient.invalidateQueries({ queryKey: medicamentKeys.lists() });
    },
  });
}

// ==================== UPDATE MEDICAMENT ====================
export function useUpdateMedicament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: medicamentData,
    }: {
      id: string;
      data: UpdateMedicamentData;
    }): Promise<Medicament> => {
      const { data } = await api.patch<Medicament>(`/medicaments/${id}`, medicamentData);
      return data;
    },
    onSuccess: (updatedMedicament) => {
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: medicamentKeys.lists() });
      // Invalider le détail
      queryClient.invalidateQueries({
        queryKey: medicamentKeys.detail(updatedMedicament.id),
      });
    },
  });
}

// ==================== DELETE MEDICAMENT ====================
export function useDeleteMedicament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/medicaments/${id}`);
    },
    onSuccess: () => {
      // Invalider toutes les listes
      queryClient.invalidateQueries({ queryKey: medicamentKeys.lists() });
    },
  });
}

// ==================== SEARCH MEDICAMENTS (Pour autocomplete) ====================
export function useSearchMedicaments(query: string) {
  return useQuery({
    queryKey: [...medicamentKeys.all, 'search', query],
    queryFn: async (): Promise<Medicament[]> => {
      if (!query || query.length < 2) return [];

      const { data } = await api.get<MedicamentsResponse>(`/medicaments?search=${query}&limit=20`);
      return data.data;
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
