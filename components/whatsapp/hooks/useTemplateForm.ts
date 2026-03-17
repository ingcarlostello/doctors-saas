import { useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { TemplateData } from "../types/template.types";
import { i18nCommon } from "../constants/template.constants";

const api = require("@/convex/_generated/api").api;

interface UseTemplateFormProps {
  onSuccess?: () => void;
}

export function useTemplateForm({ onSuccess }: UseTemplateFormProps = {}) {
  const createContentTemplate = useAction(api.twilio.createContentTemplate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [template, setTemplate] = useState<TemplateData>({
    friendlyName: "",
    templateName: "",
    category: "",
    language: "es",
    body: "",
    buttons: [],
    variableSamples: {},
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

  // Count variables in body and update samples map
  const handleBodyChange = (value: string) => {
    const matches = value.match(/\{\{\d+\}\}/g) || [];
    const uniqueVars = new Set(matches);
    setVariableCount(uniqueVars.size);

    // Keep existing samples, add new ones with empty string
    const newSamples = { ...template.variableSamples };
    uniqueVars.forEach((v) => {
      const num = v.replace(/[{}]/g, "");
      if (!(num in newSamples)) {
        newSamples[num] = ""; 
      }
    });

    // Remove old unused samples
    Object.keys(newSamples).forEach((key) => {
      if (!value.includes(`{{${key}}}`)) {
        delete newSamples[key];
      }
    });

    setTemplate({ ...template, body: value, variableSamples: newSamples });
  };

  // Add variable to body at cursor position
  const addVariable = () => {
    const newVarNum = variableCount + 1;
    const numStr = String(newVarNum);
    
    setTemplate({
      ...template,
      body: template.body + `{{${newVarNum}}}`,
      variableSamples: {
        ...template.variableSamples,
        [numStr]: "",
      }
    });
    setVariableCount(newVarNum);
  };

  // Update a specific variable sample
  const updateVariableSample = (varNumber: string, value: string) => {
    setTemplate({
      ...template,
      variableSamples: {
        ...template.variableSamples,
        [varNumber]: value,
      }
    });
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
        { id: crypto.randomUUID(), text: "", payload: "confirm" },
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

  // Update button payload
  const updateButtonPayload = (id: string, payload: string) => {
    setTemplate({
      ...template,
      buttons: template.buttons.map((btn) =>
        btn.id === id ? { ...btn, payload } : btn
      ),
    });
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
      const matches = template.body.match(/\{\{\d+\}\}/g) || [];
      const uniqueVars = new Set(matches);
      
      // Validate all variables have samples
      for (const v of uniqueVars) {
        const num = v.replace(/[{}]/g, "");
        if (!template.variableSamples[num] || template.variableSamples[num].trim() === "") {
          toast.error("Faltan muestras", {
            description: `Por favor ingresa un ejemplo realista para la variable {{${num}}}. Es obligatorio para que WhatsApp lo apruebe.`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      let types: Record<string, any> = {};

      if (template.buttons.length > 0) {
        types["twilio/quick-reply"] = {
          body: template.body,
          actions: template.buttons.map((btn) => ({
            title: i18nCommon[template.language]?.[btn.payload || "confirm"] || btn.payload,
            id: btn.payload || btn.id,
          })),
        };
      } else {
        types["twilio/text"] = {
          body: template.body,
        };
      }

      const variablesDefinition: Record<string, string> = {};
      uniqueVars.forEach((v) => {
        const num = v.replace(/[{}]/g, "");
        // We use the actual user-typed realistic example here!
        variablesDefinition[num] = template.variableSamples[num].trim();
      });

      const twilioResult = await createContentTemplate({
        friendly_name: template.friendlyName,
        language: template.language,
        category: template.category,
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

  return {
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
  };
}
