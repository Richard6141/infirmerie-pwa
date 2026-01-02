import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, XCircle, Clock, User, Calendar } from 'lucide-react';
import { useConflicts } from '@/lib/hooks/useConflicts';
import type { SyncConflict } from '@/lib/sync/syncService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialogue de résolution des conflits de synchronisation
 *
 * Affiche les conflits côte à côte et permet de choisir quelle version garder
 */
export function ConflictResolutionDialog({ open, onOpenChange }: ConflictResolutionDialogProps) {
  const { conflicts, resolveConflict, resolveAllConflicts, isResolving, conflictCount } = useConflicts();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentConflict = conflicts[currentIndex];

  const handleResolve = async (resolution: 'client' | 'server') => {
    if (!currentConflict) return;

    await resolveConflict(currentConflict.tempId, resolution);

    // Passer au conflit suivant ou fermer si c'était le dernier
    if (currentIndex >= conflicts.length - 1) {
      // C'était le dernier conflit
      setCurrentIndex(0);
      onOpenChange(false);
    } else {
      // Passer au suivant
      setCurrentIndex(currentIndex);
    }
  };

  const handleResolveAll = async (resolution: 'client' | 'server') => {
    await resolveAllConflicts(resolution);
    setCurrentIndex(0);
    onOpenChange(false);
  };

  const handleSkip = () => {
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (!currentConflict) {
    return null;
  }

  const localData = currentConflict.localData;
  const serverData = currentConflict.serverData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <DialogTitle className="text-xl">Conflit de Synchronisation</DialogTitle>
                <DialogDescription className="mt-1">
                  Choisissez quelle version de la consultation vous souhaitez conserver
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {currentIndex + 1} / {conflictCount}
            </Badge>
          </div>
        </DialogHeader>

        {/* Message du conflit */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <p className="text-sm text-orange-800">
              <strong>Raison:</strong> {currentConflict.message}
            </p>
          </CardContent>
        </Card>

        {/* Comparaison côte à côte */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Version LOCALE (Client) */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900">Votre Version (Locale)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <DataField
                label="Date"
                value={format(new Date(localData.date), 'PPP à HH:mm', { locale: fr })}
                icon={<Calendar className="h-4 w-4" />}
              />
              <DataField label="Motif" value={localData.motif} />
              <DataField label="Diagnostic" value={localData.diagnostic || '-'} />
              <DataField label="Examen" value={localData.examenClinique || '-'} />
              <DataField label="Observations" value={localData.observations || '-'} />

              {localData.constantesVitales && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Constantes Vitales</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {localData.constantesVitales.tensionArterielle && (
                      <div>
                        <span className="text-slate-500">TA:</span>{' '}
                        <span className="font-medium">{localData.constantesVitales.tensionArterielle}</span>
                      </div>
                    )}
                    {localData.constantesVitales.poids && (
                      <div>
                        <span className="text-slate-500">Poids:</span>{' '}
                        <span className="font-medium">{localData.constantesVitales.poids} kg</span>
                      </div>
                    )}
                    {localData.constantesVitales.temperature && (
                      <div>
                        <span className="text-slate-500">Temp:</span>{' '}
                        <span className="font-medium">{localData.constantesVitales.temperature}°C</span>
                      </div>
                    )}
                    {localData.constantesVitales.frequenceCardiaque && (
                      <div>
                        <span className="text-slate-500">FC:</span>{' '}
                        <span className="font-medium">{localData.constantesVitales.frequenceCardiaque} bpm</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>Créée: {format(new Date(localData.createdAt), 'PPP à HH:mm', { locale: fr })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Version SERVEUR */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-900">Version Serveur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <DataField
                label="Date"
                value={format(new Date(serverData.date), 'PPP à HH:mm', { locale: fr })}
                icon={<Calendar className="h-4 w-4" />}
              />
              <DataField label="Motif" value={serverData.motif} />
              <DataField label="Diagnostic" value={serverData.diagnostic || '-'} />
              <DataField label="Examen" value={serverData.examenClinique || '-'} />
              <DataField label="Observations" value={serverData.observations || '-'} />

              {serverData.constantesVitales && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Constantes Vitales</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {serverData.constantesVitales.tensionArterielle && (
                      <div>
                        <span className="text-slate-500">TA:</span>{' '}
                        <span className="font-medium">{serverData.constantesVitales.tensionArterielle}</span>
                      </div>
                    )}
                    {serverData.constantesVitales.poids && (
                      <div>
                        <span className="text-slate-500">Poids:</span>{' '}
                        <span className="font-medium">{serverData.constantesVitales.poids} kg</span>
                      </div>
                    )}
                    {serverData.constantesVitales.temperature && (
                      <div>
                        <span className="text-slate-500">Temp:</span>{' '}
                        <span className="font-medium">{serverData.constantesVitales.temperature}°C</span>
                      </div>
                    )}
                    {serverData.constantesVitales.frequenceCardiaque && (
                      <div>
                        <span className="text-slate-500">FC:</span>{' '}
                        <span className="font-medium">{serverData.constantesVitales.frequenceCardiaque} bpm</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>MAJ: {format(new Date(serverData.updatedAt), 'PPP à HH:mm', { locale: fr })}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6 pt-4 border-t">
          {/* Actions principales */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleResolve('client')}
              disabled={isResolving}
              variant="outline"
              className="border-blue-300 hover:bg-blue-50 hover:border-blue-400"
            >
              <User className="h-4 w-4 mr-2" />
              Garder Ma Version
            </Button>

            <Button
              onClick={() => handleResolve('server')}
              disabled={isResolving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accepter Version Serveur
            </Button>
          </div>

          {/* Actions secondaires */}
          <div className="flex items-center justify-between gap-3">
            {conflicts.length > 1 && (
              <Button
                onClick={handleSkip}
                disabled={isResolving}
                variant="ghost"
                size="sm"
                className="text-slate-600"
              >
                Passer au suivant
              </Button>
            )}

            <div className="flex-1" />

            {conflicts.length > 1 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleResolveAll('client')}
                  disabled={isResolving}
                  variant="outline"
                  size="sm"
                >
                  Tout garder (ma version)
                </Button>
                <Button
                  onClick={() => handleResolveAll('server')}
                  disabled={isResolving}
                  variant="outline"
                  size="sm"
                >
                  Tout accepter (serveur)
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Composant helper pour afficher un champ de données
 */
function DataField({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm text-slate-800 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
