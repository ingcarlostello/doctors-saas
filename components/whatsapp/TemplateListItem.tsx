import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trash2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  variables?: Record<string, string>;
}

export interface TemplateListItemProps {
  template: Template;
  isAdmin?: boolean;
  isApprovalView?: boolean;
  isCatalogView?: boolean;
}

export function TemplateListItem({ template, isAdmin = false, isApprovalView = false, isCatalogView = false }: TemplateListItemProps) {
  const variablesCount = template.variables ? Object.keys(template.variables).length : 0;

  const renderBody = (text: string) => {
    const parts = text.split(/(\{\{\d+\}\})/g);
    return parts.map((part, i) => {
      if (part.match(/\{\{\d+\}\}/)) {
        return <span key={i} className="font-semibold text-foreground">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Add a premium glow effect if we are in the approvals view and the template is pending
  const glowClasses = isApprovalView && template.status === "pending" 
    ? "border-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-100" 
    : "border-border/60 hover:shadow-md";

  return (
    <Card className={`p-6 overflow-hidden rounded-xl transition-all duration-300 bg-white flex flex-col justify-between ${glowClasses}`}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-foreground tracking-tight">
            {template.friendlyName}
          </h3>
          {isAdmin && (
            <button className="text-destructive/70 hover:text-destructive transition-colors mt-1" title="Eliminar plantilla">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 text-xs font-medium">
          <Badge variant="secondary" className="bg-muted text-foreground/80 hover:bg-muted px-2.5 py-0.5 rounded-md border-transparent text-xs">
            {template.category}
          </Badge>
          <span className="text-muted-foreground/60">&bull;</span>
          <span className="text-muted-foreground">{variablesCount} variables</span>
        </div>

        <div className="bg-muted/40 rounded-lg p-4 mb-5 text-sm text-foreground/90 leading-relaxed border border-border/40 min-h-[80px]">
          {renderBody(template.body)}
        </div>

        {template.buttons.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {template.buttons.map((btn, index) => (
              <Badge
                key={index}
                variant="outline"
                className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-normal text-xs"
              >
                {btn}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/30 mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Calendar className="w-3.5 h-3.5 opacity-70" />
          <span>Creada el {new Date(template.createdAt).toLocaleDateString()}</span>
          {!isCatalogView && (
            <>
              <span className="opacity-50">&bull;</span>
              <span>por Admin</span>
            </>
          )} 
        </div>
        
        {isCatalogView && (
          <Button variant="default" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-8 rounded-md px-3 shrink-0">
             <FileText className="w-3.5 h-3.5 mr-1.5" />
             Usar plantilla
          </Button>
        )}
      </div>
    </Card>
  );
}
