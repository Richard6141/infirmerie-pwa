import { Construction, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PageUnderConstructionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  sprint: string;
  features: string[];
}

export function PageUnderConstruction({
  title,
  description,
  icon: Icon,
  gradient,
  sprint,
  features,
}: PageUnderConstructionProps) {
  // Convertir gradient en classe de couleur
  const bgColor = gradient === 'bg-primary' ? 'bg-primary' :
                  gradient === 'bg-success' ? 'bg-success' :
                  gradient === 'bg-warning' ? 'bg-warning' :
                  gradient === 'bg-info' ? 'bg-info' :
                  gradient === 'bg-destructive' ? 'bg-destructive' :
                  'bg-primary';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${bgColor}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {sprint}
        </Badge>
      </div>

      {/* Card principale */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-warning/10 rounded-md">
              <Construction className="h-5 w-5 text-warning" />
            </div>
            <CardTitle className="text-lg">Module en construction</CardTitle>
          </div>
          <CardDescription>
            Ce module sera bientôt disponible avec toutes ses fonctionnalités
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Fonctionnalités à venir */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Fonctionnalités prévues</h3>
            </div>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-md"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-semibold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/90">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info Sprint */}
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-md">
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="text-xs text-muted-foreground">
              Implémentation prévue pour le <span className="font-medium text-primary">{sprint}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
