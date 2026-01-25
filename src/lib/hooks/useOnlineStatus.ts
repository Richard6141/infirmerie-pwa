import { useState, useEffect } from 'react';

/**
 * Vérifie la vraie connectivité Internet en essayant d'atteindre le backend
 */
async function checkRealConnectivity(): Promise<boolean> {
  try {
    // Essayer d'atteindre le health endpoint avec un timeout court
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://infirmerie-api.onrender.com'}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'cors'
    });

    clearTimeout(timeoutId);

    // Si on reçoit une réponse (même erreur), le réseau fonctionne
    return response.ok || response.status >= 400;
  } catch (error: any) {
    console.warn('[OnlineStatus] Real connectivity check failed:', error.message);
    return false;
  }
}

/**
 * Hook pour détecter le statut de connexion en ligne/hors ligne
 *
 * AMÉLIORATION: Vérifie la VRAIE connectivité Internet, pas juste navigator.onLine
 *
 * @returns {boolean} true si en ligne avec accès Internet réel, false sinon
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = async () => {
      console.log('[OnlineStatus] Network interface connected, verifying real connectivity...');

      // Vérifier la VRAIE connectivité avant de passer à online
      const hasRealConnection = await checkRealConnectivity();

      if (hasRealConnection) {
        console.log('[OnlineStatus] ✅ Real Internet connection confirmed');
        setIsOnline(true);
      } else {
        console.warn('[OnlineStatus] ⚠️ Network interface connected but no Internet access');
        setIsOnline(false);

        // Réessayer après 10 secondes
        setTimeout(async () => {
          const recheck = await checkRealConnectivity();
          if (recheck) {
            console.log('[OnlineStatus] ✅ Internet access restored on retry');
            setIsOnline(true);
          }
        }, 10000);
      }
    };

    const handleOffline = () => {
      console.log('[OnlineStatus] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook étendu avec informations détaillées sur la connexion
 */
export function useOnlineStatusExtended() {
  const isOnline = useOnlineStatus();
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({});

  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    ...connectionInfo
  };
}
