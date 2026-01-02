/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { useAuthStore } from './lib/stores/authStore';

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Composant wrapper pour charger l'utilisateur depuis le storage
function AppWrapper() {
  useEffect(() => {
    // Charger l'utilisateur depuis le localStorage au démarrage
    useAuthStore.getState().loadUserFromStorage();
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWrapper />
    </QueryClientProvider>
  </StrictMode>
);
