import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  StocksResponse,
  StockFilters,
  MouvementsStockResponse,
  MouvementStockFilters,
  CreateMouvementStockData,
  MouvementStock,
  UpdateConfigurationStockData,
  StockAlertes,
} from '@/types/stock';

// ==================== QUERY KEYS ====================

export const stockKeys = {
  all: ['stocks'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (filters: StockFilters) => [...stockKeys.lists(), filters] as const,
  alertes: () => [...stockKeys.all, 'alertes'] as const,
  mouvements: {
    all: ['mouvements-stock'] as const,
    lists: () => [...stockKeys.mouvements.all, 'list'] as const,
    list: (filters: MouvementStockFilters) => [...stockKeys.mouvements.lists(), filters] as const,
  },
};

// ==================== GET STOCKS ====================

export function useStocks(filters: StockFilters = {}) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as StockFilters;

  return useQuery({
    queryKey: stockKeys.list(cleanFilters),
    queryFn: async (): Promise<StocksResponse> => {
      const params = new URLSearchParams();

      if (cleanFilters.search) params.append('search', cleanFilters.search);
      if (cleanFilters.statut) params.append('statut', cleanFilters.statut);
      if (cleanFilters.formeGalenique) params.append('formeGalenique', cleanFilters.formeGalenique);
      if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
      if (cleanFilters.limit) params.append('limit', cleanFilters.limit.toString());

      const url = '/stocks' + (params.toString() ? '?' + params.toString() : '');
      const { data } = await api.get<StocksResponse>(url);
      return data;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

// ==================== GET ALERTES STOCK ====================

export function useStockAlertes() {
  return useQuery({
    queryKey: stockKeys.alertes(),
    queryFn: async (): Promise<StockAlertes> => {
      const { data } = await api.get<StockAlertes>('/stocks/alertes');
      return data;
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ==================== UPDATE CONFIGURATION STOCK ====================

export function useUpdateConfigurationStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      medicamentId,
      data,
    }: {
      medicamentId: string;
      data: UpdateConfigurationStockData;
    }) => {
      const response = await api.patch('/stocks/' + medicamentId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.alertes() });
    },
  });
}

// ==================== MOUVEMENTS STOCK ====================

export function useMouvementsStock(filters: MouvementStockFilters = {}) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as MouvementStockFilters;

  return useQuery({
    queryKey: stockKeys.mouvements.list(cleanFilters),
    queryFn: async (): Promise<MouvementsStockResponse> => {
      const params = new URLSearchParams();

      if (cleanFilters.medicamentId) params.append('medicamentId', cleanFilters.medicamentId);
      if (cleanFilters.type) params.append('type', cleanFilters.type);
      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);
      if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
      if (cleanFilters.limit) params.append('limit', cleanFilters.limit.toString());

      const url = '/stocks/mouvements' + (params.toString() ? '?' + params.toString() : '');
      const { data } = await api.get<MouvementsStockResponse>(url);
      return data;
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

// ==================== CREATE MOUVEMENT STOCK ====================

export function useCreateMouvementStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMouvementStockData): Promise<MouvementStock> => {
      const response = await api.post<MouvementStock>('/stocks/mouvements', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.alertes() });
      queryClient.invalidateQueries({ queryKey: stockKeys.mouvements.lists() });
    },
  });
}
