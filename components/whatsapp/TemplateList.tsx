import { TemplateListItem, Template } from "./TemplateListItem";

interface TemplateListProps {
  templates: Template[];
}

export function TemplateList({ templates }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay templates creados aún.</p>
        <p className="text-sm">Crea tu primera plantilla para empezar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <TemplateListItem key={template.id} template={template} />
      ))}
    </div>
  );
}
