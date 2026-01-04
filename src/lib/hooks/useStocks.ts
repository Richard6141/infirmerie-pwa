import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useOnlineStatus } from './useOnlineStatus';
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
  const isOnline = useOnlineStatus();

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as StockFilters;

  return useQuery({
    queryKey: stockKeys.list(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
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
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: stockKeys.alertes(),
    enabled: isOnline, // Ne fait la requête que si online
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
  const isOnline = useOnlineStatus();

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as MouvementStockFilters;

  return useQuery({
    queryKey: stockKeys.mouvements.list(cleanFilters),
    enabled: isOnline, // Ne fait la requête que si online
    queryFn: async (): Promise<MouvementsStockResponse> => {
      const params = new URLSearchParams();

      const hasFilters = Boolean(cleanFilters.type || cleanFilters.startDate || cleanFilters.endDate);
      const requestedPage = cleanFilters.page || 1;
      const requestedLimit = cleanFilters.limit || 10;

      let url: string;
      if (cleanFilters.medicamentId) {
        url = `/stocks/medicament/${cleanFilters.medicamentId}/mouvements`;
      } else {
        url = '/stocks/mouvements/all';
      }

      // Si des filtres sont actifs, on récupère "tout" (limit=1000) pour filtrer côté client
      // car l'API semble ne pas gérer les filtres type/date nativement sur cet endpoint
      if (hasFilters) {
        params.append('limit', '1000');
        params.append('page', '1');
      } else {
        if (cleanFilters.page) params.append('page', cleanFilters.page.toString());
        if (cleanFilters.limit) params.append('limit', cleanFilters.limit.toString());
      }

      // On envoie quand même les filtres au cas où l'API les supporterait un jour
      if (cleanFilters.type) params.append('type', cleanFilters.type);
      if (cleanFilters.startDate) params.append('startDate', cleanFilters.startDate);
      if (cleanFilters.endDate) params.append('endDate', cleanFilters.endDate);

      url += (params.toString() ? '?' + params.toString() : '');
      const { data } = await api.get<MouvementsStockResponse>(url);

      // Si pas de filtres, on retourne directement la réponse de l'API
      if (!hasFilters) {
        return data;
      }

      // Filtrage côté client
      let filteredData = [...data.data];

      if (cleanFilters.type) {
        filteredData = filteredData.filter(m => m.type === cleanFilters.type);
      }

      if (cleanFilters.startDate) {
        const startDate = new Date(cleanFilters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filteredData = filteredData.filter(m => new Date(m.createdAt) >= startDate);
      }

      if (cleanFilters.endDate) {
        const endDate = new Date(cleanFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filteredData = filteredData.filter(m => new Date(m.createdAt) <= endDate);
      }

      // Pagination côté client
      const total = filteredData.length;
      const totalPages = Math.ceil(total / requestedLimit);
      const startIndex = (requestedPage - 1) * requestedLimit;
      const endIndex = startIndex + requestedLimit;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        pagination: {
          page: requestedPage,
          limit: requestedLimit,
          total: total,
          totalPages: totalPages,
        }
      };
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
