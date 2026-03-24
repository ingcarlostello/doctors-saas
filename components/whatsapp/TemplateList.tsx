import { TemplateListItem, Template } from "./TemplateListItem";

interface TemplateListProps {
  templates: Template[];
  isAdmin?: boolean;
  isApprovalView?: boolean;
  isCatalogView?: boolean;
  onUseTemplate?: (template: Template) => Promise<void>;
}

export function TemplateList({ templates, isAdmin = false, isApprovalView = false, isCatalogView = false, onUseTemplate }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay templates creados aún.</p>
        <p className="text-sm">Crea tu primera plantilla para empezar.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 items-start">
      {templates.map((template) => (
        <TemplateListItem 
          key={template.id} 
          template={template} 
          isAdmin={isAdmin} 
          isApprovalView={isApprovalView}
          isCatalogView={isCatalogView}
          onUseTemplate={onUseTemplate}
        />
      ))}
    </div>
  );
}
