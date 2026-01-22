import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

export interface Template {
  id: string;
  friendlyName: string;
  templateName: string;
  category: string;
  language: string;
  body: string;
  buttons: string[];
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

interface TemplateListItemProps {
  template: Template;
}

export function TemplateListItem({ template }: TemplateListItemProps) {
  const statusConfig = {
    approved: {
      label: "Aprobado",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700 border-green-200",
    },
    pending: {
      label: "Pendiente",
      icon: Clock,
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    rejected: {
      label: "Rechazado",
      icon: Clock,
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const status = statusConfig[template.status];
  const StatusIcon = status.icon;

  console.log("Template ==========>", template);

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-semibold text-foreground">{template.friendlyName}</h3>
        <Badge variant="outline" className={status.className}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
        <Badge variant="secondary">{template.category}</Badge>
      </div>

      {/* Body Preview */}
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-muted-foreground">{template.body}</p>
      </div>

      {/* Buttons */}
      {template.buttons.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {template.buttons.map((btn, index) => (
            <Badge
              key={index}
              variant="outline"
              className="bg-background text-foreground border-border px-3 py-1 font-normal"
            >
              {btn}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Nombre: <code className="bg-muted px-1 rounded">{template.templateName}</code></span>
        <span>Idioma: {template.language.toUpperCase()}</span>
        <span>Creado: {template.createdAt}</span>
      </div>
    </Card>
  );
}
