"use client";
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
import { WhatsAppPreview } from "./WhatsAppPreview";

import { useTemplateForm } from "./hooks/useTemplateForm";
import { TemplateFormProps } from "./types/template.types";
import { categories, languages, i18nCommon } from "./constants/template.constants";

export function TemplateForm({ onSuccess }: TemplateFormProps) {
  const {
    template,
    setTemplate,
    variableCount,
    isSubmitting,
    handleFriendlyNameChange,
    handleBodyChange,
    addVariable,
    updateVariableSample,
    addButton,
    removeButton,
    updateButtonPayload,
    handleSubmit,
  } = useTemplateForm({ onSuccess });

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

          {/* Variable Samples */}
          {Object.keys(template.variableSamples).length > 0 && (
            <div className="space-y-3 mt-4 p-4 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">Ejemplos para Variables (Obligatorio)</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                WhatsApp requiere que proporciones un ejemplo realista para cada variable (ej. "Juan Pérez", "15:30", "Clínica Sur"). 
                No uses nombres de variables como "nombre_paciente".
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {Object.entries(template.variableSamples).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`sample-${key}`} className="text-xs font-medium">Muestra para {"{{"}{key}{"}}"} *</Label>
                    <Input
                      id={`sample-${key}`}
                      placeholder={`Ejemplo realista para {{${key}}}`}
                      value={value}
                      onChange={(e) => updateVariableSample(key, e.target.value)}
                      className="h-8 text-sm bg-background"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <div
                key={button.id}
                className="flex flex-col gap-2 p-3 border rounded-md"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Botón {index + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeButton(button.id)}
                    className="h-6 w-6"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Acción (Texto visible)</Label>
                    <Select
                      value={button.payload || "confirm"}
                      onValueChange={(val) => updateButtonPayload(button.id, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona acción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirm">{i18nCommon[template.language]?.confirm || "Confirmar"}</SelectItem>
                        <SelectItem value="cancel">{i18nCommon[template.language]?.cancel || "Cancelar"}</SelectItem>
                        <SelectItem value="reschedule">{i18nCommon[template.language]?.reschedule || "Reagendar"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Acción Estándar (Payload)</Label>
                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm opacity-70 cursor-not-allowed">
                      {button.payload || "confirm"}
                    </div>
                  </div>
                </div>
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
            <WhatsAppPreview 
              body={template.body} 
              buttons={template.buttons.map(btn => ({ ...btn, text: i18nCommon[template.language]?.[btn.payload || "confirm"] || (btn.payload as string) }))} 
            />
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
