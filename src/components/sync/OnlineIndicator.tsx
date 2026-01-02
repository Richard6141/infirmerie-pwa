import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

/**
 * Composant indicateur de statut de connexion internet
 * Affiche un badge vert (En ligne) ou rouge (Hors ligne)
 */
export function OnlineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <Badge
      variant={isOnline ? 'default' : 'destructive'}
      className="flex items-center gap-1.5 font-medium"
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>En ligne</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Hors ligne</span>
        </>
      )}
    </Badge>
  );
}
