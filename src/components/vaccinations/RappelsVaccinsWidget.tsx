import { Bell, Calendar, Syringe, User, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVaccinations } from '@/lib/hooks/useVaccinations';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatutRappel, STATUT_RAPPEL_COLORS, STATUT_RAPPEL_LABELS } from '@/types/vaccination';
import { useMemo } from 'react';

export function RappelsVaccinsWidget() {
  // Récupérer toutes les vaccinations avec rappel (limité à 100)
  // Les données patient sont automatiquement incluses par l'API
  const { data: vaccinationsData, isLoading, isError } = useVaccinations({ limit: 100 });

  // Calculer les rappels côté client
  const rappelsData = useMemo(() => {
    if (!vaccinationsData?.data) {
      return { data: [], total: 0 };
    }

    const limite = new Date();
    limite.setDate(limite.getDate() + 60); // 60 jours à l'avance

    const rappels = vaccinationsData.data
      .filter((vaccination) => {
        if (!vaccination.prochainRappel) return false;
        const dateRappel = new Date(vaccination.prochainRappel);
        return dateRappel <= limite;
      })
      .map((vaccination: any) => ({
        vaccinationId: vaccination.id,
        patientId: vaccination.patientId,
        // L'API retourne nomPatient directement (format: "NOM PRENOM")
        // Fallback vers patient.nom si disponible pour compatibilité
        nomPatient: vaccination.nomPatient ||
          (vaccination.patient ? `${vaccination.patient.nom} ${vaccination.patient.prenom}` : 'Patient inconnu'),
        typeVaccin: vaccination.typeVaccin,
        dateRappel: vaccination.prochainRappel!,
        statut: getStatutRappel(vaccination.prochainRappel!),
        telephone: undefined,
      }))
      .sort((a, b) => new Date(a.dateRappel).getTime() - new Date(b.dateRappel).getTime());

    return { data: rappels, total: rappels.length };
  }, [vaccinationsData]);

  const data = rappelsData;

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-blue-600" />
            Rappels Vaccinations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="shadow-card border-slate/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-slate-500" />
            Rappels Vaccinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Syringe className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Pas de données disponibles</p>
            <p className="text-xs text-slate-500 mt-1">Les rappels s'afficheront une fois les vaccinations enregistrées</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rappelsUrgents = data.data.filter((r) => r.statut === 'URGENT').length;
  const rappelsProches = data.data.filter((r) => r.statut === 'PROCHE').length;
  const totalRappels = data.total;

  return (
    <Card className="shadow-card border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-blue-600" />
            Rappels Vaccinations
          </CardTitle>
          {totalRappels > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {totalRappels}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalRappels === 0 ? (
          <div className="text-center py-6">
            <Syringe className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium text-green-700">Aucun rappel à venir</p>
            <p className="text-xs text-slate-500 mt-1">Tous les rappels sont à jour</p>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-3">
              {rappelsUrgents > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Urgents</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">{rappelsUrgents}</p>
                </div>
              )}
              {rappelsProches > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-700">À venir</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{rappelsProches}</p>
                </div>
              )}
            </div>

            {/* Liste des rappels */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Prochains rappels</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.data.slice(0, 5).map((rappel) => {
                  return (
                    <div
                      key={rappel.vaccinationId}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            <p className="text-sm font-semibold text-slate-900">
                              {rappel.nomPatient}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Syringe className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-xs text-slate-600">{rappel.typeVaccin}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-xs text-slate-500">
                              {new Date(rappel.dateRappel).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={STATUT_RAPPEL_COLORS[rappel.statut]}>
                          {STATUT_RAPPEL_LABELS[rappel.statut]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {data.data.length > 5 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{data.data.length - 5} autre(s) rappel(s)
                  </p>
                )}
              </div>
            </div>

            {/* Bouton voir tous */}
            <Link to="/vaccinations" className="block">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Voir toutes les vaccinations
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
