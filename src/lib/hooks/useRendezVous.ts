import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  RendezVous,
  RendezVousFilters,
  RendezVousResponse,
  CreateRendezVousData,
  UpdateRendezVousData,
} from '@/types/rendez-vous';

// Query keys
export const rendezVousKeys = {
  all: ['rendez-vous'] as const,
  lists: () => [...rendezVousKeys.all, 'list'] as const,
  list: (filters: RendezVousFilters) => [...rendezVousKeys.lists(), filters] as const,
  details: () => [...rendezVousKeys.all, 'detail'] as const,
  detail: (id: string) => [...rendezVousKeys.details(), id] as const,
  byPatient: (patientId: string) => [...rendezVousKeys.all, 'patient', patientId] as const,
  today: () => [...rendezVousKeys.all, 'today'] as const,
  upcoming: () => [...rendezVousKeys.all, 'upcoming'] as const,
};

// ==================== GET RENDEZ-VOUS (Liste avec filtres) ====================
export function useRendezVous(filters: RendezVousFilters = {}) {
  // Nettoyer les filtres (enlever undefined)
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as RendezVousFilters;

  return useQuery({
    queryKey: rendezVousKeys.list(cleanFilters),
    queryFn: async (): Promise<RendezVousResponse> => {
      const params = new URLSearchParams();

      if (cleanFilters.search) params.append('search', cleanFilters.search);
      if (cleanFilters.patientId) params.append('patientId', cleanFilters.patientId);
      if (cleanFilters.statut) params.append('statut', cleanFilters.statut);
      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
      if (cleanFilters.limit) params.append('limit', cleanFilters.limit.toString());

      const { data } = await api.get<RendezVousResponse>(`/rendez-vous?${params.toString()}`);
      return data;
    },
    staleTime: 0, // Toujours refetch pour que les filtres fonctionnent
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== GET RENDEZ-VOUS (Détail par ID) ====================
export function useRendezVousDetail(id: string | undefined) {
  return useQuery({
    queryKey: rendezVousKeys.detail(id!),
    queryFn: async (): Promise<RendezVous> => {
      const { data } = await api.get<RendezVous>(`/rendez-vous/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== GET RENDEZ-VOUS PAR PATIENT ====================
export function useRendezVousByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: rendezVousKeys.byPatient(patientId!),
    queryFn: async (): Promise<RendezVous[]> => {
      const { data } = await api.get<RendezVous[]>(`/rendez-vous/patient/${patientId}`);
      return data;
    },
    enabled: !!patientId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== GET RENDEZ-VOUS DU JOUR ====================
export function useRendezVousToday() {
  return useQuery({
    queryKey: rendezVousKeys.today(),
    queryFn: async (): Promise<RendezVous[]> => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get<RendezVousResponse>(
        `/rendez-vous?startDate=${today}&endDate=${today}`
      );
      return data.data;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch toutes les 5 minutes
  });
}

// ==================== GET RENDEZ-VOUS À VENIR (7 JOURS) ====================
export function useRendezVousUpcoming() {
  return useQuery({
    queryKey: rendezVousKeys.upcoming(),
    queryFn: async (): Promise<RendezVous[]> => {
      const today = new Date().toISOString().split('T')[0];
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      const endDate = in7Days.toISOString().split('T')[0];

      const { data } = await api.get<RendezVousResponse>(
        `/rendez-vous?startDate=${today}&endDate=${endDate}&limit=50`
      );
      return data.data;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== CREATE RENDEZ-VOUS ====================
export function useCreateRendezVous() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rendezVousData: CreateRendezVousData): Promise<RendezVous> => {
      const { data } = await api.post<RendezVous>('/rendez-vous', rendezVousData);
      return data;
    },
    onSuccess: () => {
      // Invalider toutes les listes
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.lists() });
      // Invalider les RDV du jour et à venir
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.today() });
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.upcoming() });
    },
  });
}

// ==================== UPDATE RENDEZ-VOUS ====================
export function useUpdateRendezVous() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data: rendezVousData,
    }: {
      id: string;
      data: UpdateRendezVousData;
    }): Promise<RendezVous> => {
      const { data } = await api.patch<RendezVous>(`/rendez-vous/${id}`, rendezVousData);
      return data;
    },
    onSuccess: (updatedRendezVous) => {
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.lists() });
      // Invalider le détail
      queryClient.invalidateQueries({
        queryKey: rendezVousKeys.detail(updatedRendezVous.id),
      });
      // Invalider les RDV du jour et à venir
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.today() });
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.upcoming() });
    },
  });
}

// ==================== DELETE RENDEZ-VOUS ====================
export function useDeleteRendezVous() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/rendez-vous/${id}`);
    },
    onSuccess: () => {
      // Invalider toutes les listes
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.lists() });
      // Invalider les RDV du jour et à venir
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.today() });
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.upcoming() });
    },
  });
}

// ==================== UPDATE STATUT RENDEZ-VOUS ====================
export function useUpdateStatutRendezVous() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: string;
    }): Promise<RendezVous> => {
      const { data } = await api.patch<RendezVous>(`/rendez-vous/${id}`, { statut });
      return data;
    },
    onSuccess: (updatedRendezVous) => {
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.lists() });
      // Invalider le détail
      queryClient.invalidateQueries({
        queryKey: rendezVousKeys.detail(updatedRendezVous.id),
      });
      // Invalider les RDV du jour et à venir
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.today() });
      queryClient.invalidateQueries({ queryKey: rendezVousKeys.upcoming() });
    },
  });
}
