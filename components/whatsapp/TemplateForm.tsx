"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MessageSquare, Info } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppPreview } from "./WhatsAppPreview";
import { useAction, useMutation } from "convex/react";
const api = require("@/convex/_generated/api").api;

interface QuickReplyButton {
  id: string;
  text: string;
}

interface TemplateData {
  friendlyName: string;
  templateName: string;
  category: string;
  language: string;
  body: string;
  buttons: QuickReplyButton[];
}

const categories = [
  { value: "UTILITY", label: "Utilidad (Citas, Recordatorios)" },
  { value: "MARKETING", label: "Marketing" },
  { value: "AUTHENTICATION", label: "Autenticación" },
];

const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

interface TemplateFormProps {
  onSuccess?: () => void;
}

export function TemplateForm({ onSuccess }: TemplateFormProps) {
  const createContentTemplate = useAction(api.twilio.createContentTemplate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [template, setTemplate] = useState<TemplateData>({
    friendlyName: "",
    templateName: "",
    category: "",
    language: "es",
    body: "",
    buttons: [],
  });

  const [variableCount, setVariableCount] = useState(0);

  // Convert friendly name to template name (lowercase, underscores)
  const handleFriendlyNameChange = (value: string) => {
    const templateName = value
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    setTemplate({
      ...template,
      friendlyName: value,
      templateName,
    });
  };

  // Count variables in body
  const handleBodyChange = (value: string) => {
    const matches = value.match(/\{\{\d+\}\}/g) || [];
    const uniqueVars = new Set(matches);
    setVariableCount(uniqueVars.size);
    setTemplate({ ...template, body: value });
  };

  // Add variable to body at cursor position
  const addVariable = () => {
    const newVarNum = variableCount + 1;
    setTemplate({
      ...template,
      body: template.body + `{{${newVarNum}}}`,
    });
    setVariableCount(newVarNum);
  };

  // Add button
  const addButton = () => {
    if (template.buttons.length >= 3) {
      toast.error("Límite alcanzado", {
        description: "Solo puedes agregar hasta 3 botones de respuesta rápida.",
      });
      return;
    }

    setTemplate({
      ...template,
      buttons: [
        ...template.buttons,
        { id: crypto.randomUUID(), text: "" },
      ],
    });
  };

  // Remove button
  const removeButton = (id: string) => {
    setTemplate({
      ...template,
      buttons: template.buttons.filter((btn) => btn.id !== id),
    });
  };

  // Update button text
  const updateButtonText = (id: string, text: string) => {
    if (text.length > 20) {
      toast.error("Texto muy largo", {
        description: "El texto del botón no puede superar 20 caracteres.",
      });
      return;
    }

    setTemplate({
      ...template,
      buttons: template.buttons.map((btn) =>
        btn.id === id ? { ...btn, text } : btn
      ),
    });
  };

  // Generate JSON output
  const generateJSON = () => {
    const output = {
      friendly_name: template.friendlyName,
      language: template.language,
      types: {
        "twilio/text": {
          body: template.body,
        },
        ...(template.buttons.length > 0 && {
          "twilio/quick-reply": {
            buttons: template.buttons.map((btn) => ({
              type: "quick_reply",
              text: btn.text,
            })),
          },
        }),
      },
    };
    return JSON.stringify(output, null, 2);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!template.friendlyName || !template.category || !template.body) {
      toast.error("Campos requeridos", {
        description: "Por favor completa todos los campos obligatorios.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create in Twilio
      const twilioVariables: Record<string, string> = {};
      const matches = template.body.match(/\{\{\d+\}\}/g) || [];
      const uniqueVars = new Set(matches);
      uniqueVars.forEach((v) => {
        const num = v.replace(/[{}]/g, "");
        twilioVariables[num] = "val"; // Placeholder as requested by API structure usually
      });

      const types = {
        "twilio/text": {
          body: template.body,
        },
        ...(template.buttons.length > 0 && {
          "twilio/quick-reply": {
            body: template.body, // Quick reply expects body inside too? Check API docs logic. 
            // Wait, standard structure: types: { "twilio/text": { ... }, "twilio/quick-reply": { ... } } ?
            // User provided example: types: { "twilio/quick-reply": { body: "...", actions: [...] }, "twilio/text": { body: "..." } }
            // So if buttons exist, we might need both or just quick-reply. 
            // Usually Content API uses one type based on channel capability but here we define template structure.
            // The user example had BOTH types.
            actions: template.buttons.map((btn) => ({
              title: btn.text,
              id: btn.id,
            })),
          },
        }),
      };

      // If we have buttons, the user example shows sending BOTH text and quick-reply types.
      // But actually, for a single template, we usually define the content types available.
      // Let's stick to the generated JSON logic the user liked/provided, but ensure we pass it correctly.

      const contentVariables = {};
      // api expects "variables": {"1":"nombre"} mapping.
      // template has body "Hola {{1}}".
      // We should pass the definition of variables.
      const variablesDefinition: Record<string, string> = {};
      uniqueVars.forEach((v) => {
        const num = v.replace(/[{}]/g, "");
        variablesDefinition[num] = "custom_variable"; // or friendly name
      });

      const twilioResult = await createContentTemplate({
        friendly_name: template.friendlyName,
        language: template.language,
        variables: variablesDefinition,
        types: types,
      });

      console.log("Twilio Result:", twilioResult);

      toast.success("Plantilla creada", {
        description: "La plantilla ha sido enviada a Twilio exitosamente.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error al crear plantilla", {
        description: error.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Configuración de Plantilla
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Friendly Name */}
          <div className="space-y-2">
            <Label htmlFor="friendlyName">Nombre de la Plantilla *</Label>
            <Input
              id="friendlyName"
              placeholder="Ej: Recordatorio Cita Opciones"
              value={template.friendlyName}
              onChange={(e) => handleFriendlyNameChange(e.target.value)}
            />
            {template.templateName && (
              <p className="text-xs text-muted-foreground">
                Template ID: <code className="bg-muted px-1 rounded">{template.templateName}</code>
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select
              value={template.category}
              onValueChange={(value) => setTemplate({ ...template, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Idioma *</Label>
            <Select
              value={template.language}
              onValueChange={(value) => setTemplate({ ...template, language: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un idioma" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Cuerpo del Mensaje *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariable}
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar Variable
              </Button>
            </div>
            <Textarea
              id="body"
              placeholder="Hola {{1}} tu próxima cita es el día {{2}}."
              value={template.body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBodyChange(e.target.value)}
              rows={4}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3" />
              <span>
                Usa {"{{1}}"}, {"{{2}}"}, etc. para variables dinámicas. Variables detectadas: {variableCount}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3 mt-8">
            <div className="flex items-center justify-between">
              <Label>Botones de Respuesta Rápida (Máx. 3)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addButton}
                disabled={template.buttons.length >= 3}
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar Botón
              </Button>
            </div>

            {template.buttons.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay botones agregados. Los botones son opcionales.
              </p>
            )}

            {template.buttons.map((button, index) => (
              <div key={button.id} className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">
                  {index + 1}
                </Badge>
                <Input
                  placeholder="Texto del botón (máx. 20 caracteres)"
                  value={button.text}
                  onChange={(e) => updateButtonText(button.id, e.target.value)}
                  maxLength={20}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeButton(button.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear Plantilla"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="space-y-6">
        {/* WhatsApp Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <WhatsAppPreview body={template.body} buttons={template.buttons} />
          </CardContent>
        </Card>

        {/* JSON Output */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estructura JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
              {generateJSON()}
            </pre>
          </CardContent>
        </Card> */}

        {/* Usage Example */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ejemplo de Uso (Node.js)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {`client.messages.create({
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:+57XXXXXXXXXX',
    contentSid: 'HXxxxxxxxxxxxx',
    contentVariables: JSON.stringify({
${Array.from({ length: variableCount }, (_, i) =>
                `      "${i + 1}": "valor_${i + 1}"`
              ).join(",\n")}
    })
})`}
            </pre>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
