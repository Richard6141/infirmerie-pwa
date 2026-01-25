import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface StatsChartProps {
  title: string;
  data: Array<{ name: string; value: number; }>;
  type?: 'bar' | 'pie';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function StatsChart({ title, data, type = 'bar' }: StatsChartProps) {
  if (type === 'pie') {
    return (
      <Card className="shadow-card border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
            <TrendingUp className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-slate-200">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
          <TrendingUp className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
