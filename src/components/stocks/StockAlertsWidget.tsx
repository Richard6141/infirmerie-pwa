import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStockAlertes } from '@/lib/hooks/useStocks';
import { Skeleton } from '@/components/ui/skeleton';

export function StockAlertsWidget() {
  // Utiliser l'endpoint /stocks/alertes de l'API
  const { data, isLoading, isError } = useStockAlertes();

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-orange-600" />
            Alertes de Stock
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

  if (isError || !data) {
    return (
      <Card className="shadow-card border-slate/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-slate-500" />
            Alertes de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Pas de données disponibles</p>
            <p className="text-xs text-slate-500 mt-1">Les alertes s'afficheront une fois les stocks configurés</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vérifier que les données ont la bonne structure
  const ruptures = data.ruptures || [];
  const critiques = data.critiques || [];
  const bas = data.bas || [];
  const totalAlertes = ruptures.length + critiques.length + bas.length;

  return (
    <Card className="shadow-card border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-orange-600" />
            Alertes de Stock
          </CardTitle>
          {totalAlertes > 0 && (
            <Badge variant="destructive" className="bg-orange-600">
              {totalAlertes}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalAlertes === 0 ? (
          <div className="text-center py-6">
            <Package className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium text-green-700">Tous les stocks sont normaux</p>
            <p className="text-xs text-slate-500 mt-1">Aucune alerte à signaler</p>
          </div>
        ) : (
          <>
            {/* Ruptures de stock */}
            {ruptures.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h4 className="text-sm font-semibold text-red-700">
                    Rupture de stock ({ruptures.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {ruptures.slice(0, 3).map((item) => (
                    <div
                      key={item.medicamentId}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">{item.nomCommercial}</p>
                          <p className="text-xs text-red-700 mt-0.5">Stock: {item.quantiteActuelle}</p>
                        </div>
                        <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                  {ruptures.length > 3 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{ruptures.length - 3} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Stock critique */}
            {critiques.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-semibold text-orange-700">
                    Stock critique ({critiques.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {critiques.slice(0, 2).map((item) => (
                    <div
                      key={item.medicamentId}
                      className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-orange-900">{item.nomCommercial}</p>
                          <p className="text-xs text-orange-700 mt-0.5">
                            Stock: {item.quantiteActuelle} / Seuil: {item.seuilMin}
                          </p>
                        </div>
                        <TrendingDown className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                  {critiques.length > 2 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{critiques.length - 2} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Stock bas */}
            {bas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <h4 className="text-sm font-semibold text-yellow-700">
                    Stock bas ({bas.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {bas.slice(0, 2).map((item) => (
                    <div
                      key={item.medicamentId}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-yellow-900">{item.nomCommercial}</p>
                          <p className="text-xs text-yellow-700 mt-0.5">
                            Stock: {item.quantiteActuelle} / Seuil: {item.seuilMin}
                          </p>
                        </div>
                        <TrendingDown className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                  {bas.length > 2 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{bas.length - 2} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bouton voir tous */}
            <Link to="/stocks" className="block">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Voir tous les stocks
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
