import { useState } from 'react';
import { BarChart, FileText, Package, Syringe, TrendingUp, Users, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDashboardStats } from '@/lib/hooks/useRapports';
import { Loader2 } from 'lucide-react';

export function RapportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart className="h-8 w-8 text-purple-600" />
            Rapports & Statistiques
          </h1>
          <p className="text-slate-600 mt-1">
            Vue d'ensemble et rapports détaillés de l'activité
          </p>
        </div>
      </div>

      {/* Période de rapport */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Période du rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Date début"
              className="bg-white"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Date fin"
              className="bg-white"
            />
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques clés */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Patients"
              value={stats.totalPatients}
              icon={<Users className="h-5 w-5" />}
              color="bg-blue-600"
            />
            <StatCard
              title="Consultations (mois)"
              value={stats.consultationsMoisEnCours}
              icon={<FileText className="h-5 w-5" />}
              color="bg-emerald-600"
            />
            <StatCard
              title="Vaccinations (mois)"
              value={stats.vaccinationsMoisEnCours}
              icon={<Syringe className="h-5 w-5" />}
              color="bg-orange-600"
            />
            <StatCard
              title="RDV à venir"
              value={stats.rendezVousAVenir}
              icon={<Calendar className="h-5 w-5" />}
              color="bg-purple-600"
            />
          </div>

          {/* Sections de rapports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consultations par jour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Consultations (7 derniers jours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.consultationsParJour.slice(-7).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-3 flex-1 ml-4">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${(item.count / Math.max(...stats.consultationsParJour.map(i => i.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top motifs */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Motifs de consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topMotifsConsultations.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex-1 truncate">{item.motif}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.count / Math.max(...stats.topMotifsConsultations.map(i => i.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Répartition par direction */}
            <Card>
              <CardHeader>
                <CardTitle>Patients par Direction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.repartitionPatientsParDirection.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex-1 truncate">{item.direction}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(item.count / Math.max(...stats.repartitionPatientsParDirection.map(i => i.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Note pour export PDF */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Export PDF</CardTitle>
                <CardDescription className="text-purple-600">
                  Fonctionnalité à venir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  L'export PDF des rapports sera disponible prochainement avec :
                </p>
                <ul className="list-disc list-inside mt-3 text-sm text-slate-600 space-y-1">
                  <li>Graphiques intégrés</li>
                  <li>Tableaux détaillés</li>
                  <li>Mise en page professionnelle</li>
                  <li>Logo et en-tête personnalisés</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-slate-500">
              Aucune donnée disponible pour générer le rapport
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
