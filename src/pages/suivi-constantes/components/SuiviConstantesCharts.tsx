import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity } from 'lucide-react';
import type { EvolutionData } from '@/types/suivi-constantes';

interface SuiviConstantesChartsProps {
    evolution: EvolutionData;
}

export function SuiviConstantesCharts({ evolution }: SuiviConstantesChartsProps) {
    if (!evolution) {
        return null; // Should be handled by parent
    }

    // 1. Extraire toutes les dates uniques de tous les indicateurs
    const allDates = new Set<string>();
    const indicators = [
        evolution.glycemie,
        evolution.tensionSystolique,
        evolution.tensionDiastolique,
        evolution.poids,
        evolution.imc,
        evolution.frequenceCardiaque,
        evolution.temperature,
        evolution.saturationOxygene
    ];

    indicators.forEach((arr) => {
        if (Array.isArray(arr)) {
            arr.forEach((point) => point.date && allDates.add(point.date));
        }
    });

    const sortedDates = Array.from(allDates).sort();

    if (sortedDates.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-slate-100 mb-6">
                <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">Pas assez de données</p>
                <p className="text-sm mt-1">
                    L'évolution s'affichera dès que plusieurs prises seront enregistrées.
                </p>
            </div>
        );
    }

    // 2. Construire les données pour le graphique (Row-based)
    const chartData = sortedDates.map((date) => {
        const findVal = (arr: any[]) => arr?.find((p: any) => p.date === date)?.valeur ?? null;

        return {
            dateStr: date, // Pour usage interne si besoin
            date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            tensionSystolique: findVal(evolution.tensionSystolique),
            tensionDiastolique: findVal(evolution.tensionDiastolique),
            frequenceCardiaque: findVal(evolution.frequenceCardiaque),
            temperature: findVal(evolution.temperature),
            saturationOxygene: findVal(evolution.saturationOxygene),
            glycemie: findVal(evolution.glycemie),
            poids: findVal(evolution.poids),
            imc: findVal(evolution.imc),
        };
    });

    // Helpers pour l'affichage des stats (si disponibles)
    const stats = evolution.stats || {};

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Évolution des constantes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="tension" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="tension">Tension</TabsTrigger>
                        <TabsTrigger value="glycemie">Glycémie</TabsTrigger>
                        <TabsTrigger value="imc">IMC</TabsTrigger>
                        <TabsTrigger value="autres">Autres</TabsTrigger>
                    </TabsList>

                    {/* Graphique Tension */}
                    <TabsContent value="tension" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="3 3" label="Normal sys." />
                                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" label="Normal dia." />
                                <Line
                                    type="monotone"
                                    dataKey="tensionSystolique"
                                    stroke="#ef4444"
                                    name="Systolique (mmHg)"
                                    strokeWidth={2}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tensionDiastolique"
                                    stroke="#3b82f6"
                                    name="Diastolique (mmHg)"
                                    strokeWidth={2}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        {stats.tensionMoyenne && (
                            <div className="bg-slate-50 p-3 rounded-md text-center">
                                <p className="text-sm font-medium text-slate-600">Moyenne sur la période</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {stats.tensionMoyenne.systolique?.toFixed(0)} / {stats.tensionMoyenne.diastolique?.toFixed(0)} mmHg
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Graphique Glycémie */}
                    <TabsContent value="glycemie" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={0.8} stroke="#22c55e" strokeDasharray="3 3" label="Min" />
                                <ReferenceLine y={1.2} stroke="#22c55e" strokeDasharray="3 3" label="Max" />
                                <Line
                                    type="monotone"
                                    dataKey="glycemie"
                                    stroke="#8b5cf6"
                                    name="Glycémie (g/L)"
                                    strokeWidth={2}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        {stats.glycemieMoyenne !== undefined && (
                            <div className="bg-slate-50 p-3 rounded-md text-center">
                                <p className="text-sm font-medium text-slate-600">Moyenne sur la période</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {stats.glycemieMoyenne.toFixed(2)} g/L
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Graphique IMC */}
                    <TabsContent value="imc" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={18.5} yAxisId="left" stroke="#f59e0b" strokeDasharray="3 3" label="Maigreur" />
                                <ReferenceLine y={25} yAxisId="left" stroke="#22c55e" strokeDasharray="3 3" label="Normal" />
                                <ReferenceLine y={30} yAxisId="left" stroke="#f59e0b" strokeDasharray="3 3" label="Surpoids" />
                                <Line
                                    type="monotone"
                                    dataKey="imc"
                                    stroke="#10b981"
                                    name="IMC"
                                    strokeWidth={2}
                                    yAxisId="left"
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="poids"
                                    stroke="#6366f1"
                                    name="Poids (kg)"
                                    strokeWidth={2}
                                    yAxisId="right"
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-4 text-center bg-slate-50 p-3 rounded-md">
                            {stats.imcMoyen !== undefined && (
                                <div>
                                    <p className="text-sm font-medium text-slate-600">IMC Moyen</p>
                                    <p className="text-lg font-bold text-slate-800">{stats.imcMoyen.toFixed(1)}</p>
                                </div>
                            )}
                            {stats.poidsMoyen !== undefined && (
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Poids Moyen</p>
                                    <p className="text-lg font-bold text-slate-800">{stats.poidsMoyen.toFixed(1)} kg</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Autres constantes */}
                    <TabsContent value="autres" className="space-y-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="frequenceCardiaque"
                                    stroke="#f97316"
                                    name="FC (bpm)"
                                    strokeWidth={2}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="temperature"
                                    stroke="#ec4899"
                                    name="Temp (°C)"
                                    strokeWidth={2}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="saturationOxygene"
                                    stroke="#06b6d4"
                                    name="SpO₂ (%)"
                                    strokeWidth={2}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
