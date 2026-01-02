import { useState, useEffect } from 'react';

/**
 * Hook pour détecter le statut de connexion en ligne/hors ligne
 *
 * @returns {boolean} true si en ligne, false si hors ligne
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('[OnlineStatus] Connection restored');
      setIsOnline(true);
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
