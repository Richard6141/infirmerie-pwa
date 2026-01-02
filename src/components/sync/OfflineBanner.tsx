import { WifiOff, X } from 'lucide-react';
import { useState } from 'react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-white shadow-lg animate-slide-down">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 animate-pulse" />
            <div>
              <p className="text-sm font-semibold">Vous êtes hors ligne</p>
              <p className="text-xs opacity-90">
                Vos modifications seront synchronisées automatiquement lors du retour de la connexion
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OfflineBannerCompact() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-warning/20 border-l-4 border-l-warning px-4 py-3 mb-4">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 text-warning" />
        <p className="text-sm text-slate-700">
          <span className="font-semibold">Mode hors ligne.</span> Les données seront synchronisées au retour de la connexion.
        </p>
      </div>
    </div>
  );
}
