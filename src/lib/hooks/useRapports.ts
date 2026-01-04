import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useOnlineStatus } from './useOnlineStatus';
import type {
  DashboardStats,
  RapportConsultations,
  RapportConsultationsFilters,
  RapportStocks,
  RapportStocksFilters,
  RapportVaccinations,
  RapportVaccinationsFilters,
} from '@/types/rapport';

// Query keys
export const rapportKeys = {
  all: ['rapports'] as const,
  dashboard: () => [...rapportKeys.all, 'dashboard'] as const,
  consultations: (filters: RapportConsultationsFilters) => [...rapportKeys.all, 'consultations', filters] as const,
  stocks: (filters: RapportStocksFilters) => [...rapportKeys.all, 'stocks', filters] as const,
  vaccinations: (filters: RapportVaccinationsFilters) => [...rapportKeys.all, 'vaccinations', filters] as const,
};

// ==================== GET DASHBOARD STATS ====================
export function useDashboardStats() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: rapportKeys.dashboard(),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<DashboardStats> => {
      const { data } = await api.get<DashboardStats>('/rapports/dashboard');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== GET RAPPORT CONSULTATIONS ====================
export function useRapportConsultations(filters: RapportConsultationsFilters = {}) {
  const isOnline = useOnlineStatus();

  // Nettoyer les filtres
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as RapportConsultationsFilters;

  return useQuery({
    queryKey: rapportKeys.consultations(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<RapportConsultations> => {
      const params = new URLSearchParams();

      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.infirmierId) params.append('infirmierId', cleanFilters.infirmierId);

      const { data } = await api.get<RapportConsultations>(`/rapports/consultations?${params.toString()}`);
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== GET RAPPORT STOCKS ====================
export function useRapportStocks(filters: RapportStocksFilters = {}) {
  const isOnline = useOnlineStatus();

  // Nettoyer les filtres
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as RapportStocksFilters;

  return useQuery({
    queryKey: rapportKeys.stocks(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<RapportStocks> => {
      const params = new URLSearchParams();

      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.statut) params.append('statut', cleanFilters.statut);
      if (cleanFilters.formeGalenique) params.append('formeGalenique', cleanFilters.formeGalenique);
      if (cleanFilters.exportType) params.append('exportType', cleanFilters.exportType);

      const { data } = await api.get<RapportStocks>(`/rapports/stocks?${params.toString()}`);
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ==================== GET RAPPORT VACCINATIONS ====================
export function useRapportVaccinations(filters: RapportVaccinationsFilters = {}) {
  const isOnline = useOnlineStatus();

  // Nettoyer les filtres
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as RapportVaccinationsFilters;

  return useQuery({
    queryKey: rapportKeys.vaccinations(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<RapportVaccinations> => {
      const params = new URLSearchParams();

      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.typeVaccin) params.append('typeVaccin', cleanFilters.typeVaccin);

      const { data } = await api.get<RapportVaccinations>(`/rapports/vaccinations?${params.toString()}`);
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
