import { CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TemplateStats {
  approved: number;
  pending: number;
  total: number;
}

interface TemplateStatCardsProps {
  stats: TemplateStats;
}

export function TemplateStatCards({ stats }: TemplateStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">Templates Aprobados</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-amber-100">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pendientes de Aprobación</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-muted">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Templates</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
